/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const path = require('path');
const http = require('http');
const EventEmitter = require('events');
const getPort = require('get-port');
const {spawn} = require('child_process');
const {promisify} = require('util');
const openUrl = require('react-dev-utils/openBrowser');
const httpProxy = require('http-proxy');
const net = require('net');
const readline = require('readline');
const chalk = require('chalk');

const renderHtmlError = require('./server-error').renderHtmlError;
const fs = require('fs');

const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

const entryFile = '.fusion/dist/development/server/server-main.js';
let entryFileLastModifiedTime = Date.now();
// mechanism to allow a running proxy server to wait for a child process server to start
function Lifecycle() {
  const emitter = new EventEmitter();
  const state = {started: false, error: undefined};
  let listening = false;
  return {
    start: () => {
      state.started = true;
      state.error = undefined;
      emitter.emit('message');
    },
    stop: () => {
      state.started = false;
    },
    error: error => {
      state.error = error;
      // The error listener may emit before we call wait.
      // Make sure that we're listening before attempting to emit.
      if (listening) {
        emitter.emit('message', error);
      }
    },
    wait: () => {
      return new Promise((resolve, reject) => {
        if (state.started) resolve();
        else if (state.error) reject(state.error);
        else {
          listening = true;
          emitter.once('message', (error /*: Error */) => {
            if (error) {
              listening = false;
              return reject(error);
            }

            resolve();
          });
        }
      });
    },
  };
}

/*::
type DevRuntimeType = {
  run: () => any,
  start: () => any,
  stop: () => any,
  invalidate: () => void
};
*/

module.exports.DevelopmentRuntime = function(
  {
    port,
    dir = '.',
    noOpen,
    middleware = (req, res, next) => next(),
    debug = false,
    disablePrompts = false,
    experimentalSkipRedundantServerReloads,
  } /*: any */
) /*: DevRuntimeType */ {
  const lifecycle = new Lifecycle();
  const state = {
    server: null,
    proc: null,
    proxy: null,
  };

  const resolvedChalkPath = require.resolve('chalk');
  const resolvedServerErrorPath = require.resolve('./server-error');

  this.run = async function reloadProc() {
    const childPort = await getPort();
    const command = `
      process.on('SIGTERM', () => process.exit());
      process.on('SIGINT', () => process.exit());

      const fs = require('fs');
      const path = require('path');
      const chalk = require(${JSON.stringify(resolvedChalkPath)});
      const renderTerminalError = require(${JSON.stringify(
        resolvedServerErrorPath
      )}).renderTerminalError;

      const logErrors = e => {
        //eslint-disable-next-line no-console
        console.error(renderTerminalError(e));
      }

      const logAndSend = e => {
        logErrors(e);
        process.send({event: 'error', payload: {
          message: e.message,
          name: e.name,
          stack: e.stack,
          type: e.type,
          link: e.link
        }});
      }

      const entry = path.resolve('${entryFile}');

      if (fs.existsSync(entry)) {
        try {
          const {start} = require(entry);
          start({port: ${childPort}})
            .then(() => {
              process.send({event: 'started'})
            })
            .catch(logAndSend); // handle server bootstrap errors (e.g. port already in use)
        }
        catch (e) {
          logAndSend(e); // handle app top level errors
        }
      }
      else {
        logAndSend(new Error(\`No entry found at \${entry}\`));
      }
    `;
    if (experimentalSkipRedundantServerReloads && await exists(entryFile)) {
      const entryFileStats = await stat(entryFile);
      if (
        entryFileStats.mtime.toString() ===
          entryFileLastModifiedTime.toString() &&
        state.proc &&
        state.proxy
      ) {
        console.log('Server bundle not changed, skipping server restart.');
        lifecycle.start();
        return;
      } else {
        entryFileLastModifiedTime = entryFileStats.mtime;
      }
    }

    killProc();

    return new Promise((resolve, reject) => {
      function handleChildServerCrash(err) {
        lifecycle.stop();
        killProc();
        reject(err);
      }
      const args = ['-e', command];
      if (debug) args.push('--inspect-brk');

      state.proxy = httpProxy.createProxyServer({
        target: {
          host: 'localhost',
          port: childPort,
        },
      });

      // $FlowFixMe
      state.proc = spawn('node', args, {
        cwd: path.resolve(process.cwd(), dir),
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      });
      // $FlowFixMe
      state.proc.on('error', handleChildServerCrash);
      // $FlowFixMe
      state.proc.on('exit', handleChildServerCrash);
      // $FlowFixMe
      state.proc.on('message', message => {
        if (message.event === 'started') {
          lifecycle.start();
          resolve();
        }
        if (message.event === 'error') {
          lifecycle.error(message.payload);
          killProc();
          reject(new Error('Received error message from server'));
        }
      });
    });
  };

  this.invalidate = () => lifecycle.stop();

  function killProc() {
    if (state.proc) {
      lifecycle.stop();
      state.proc.removeAllListeners();
      state.proc.kill();
      state.proc = null;
    }
    if (state.proxy) {
      state.proxy.close();
      state.proxy = null;
    }
  }

  this.start = async function start() {
    const portAvailable = await isPortAvailable(port);
    if (!portAvailable) {
      if (disablePrompts) {
        // Fast fail, don't prompt
        throw new Error(`Port ${port} taken by another process`);
      }
      const useRandomPort = await prompt(`Port ${port} taken! Continue with a different port?`);
      if (useRandomPort) {
        let ports = [];
        for (let i = 1; i <= 10; i++) {
          ports.push(port + i);
        }
        port = await getPort({port: ports});
      }
    }

    // $FlowFixMe
    state.server = http.createServer((req, res) => {
      middleware(req, res, async () => {
        lifecycle.wait().then(
          () => {
            // $FlowFixMe
            state.proxy.web(req, res, e => {
              if (res.finished) return;

              res.write(renderHtmlError(e));
              res.end();
            });
          },
          error => {
            if (res.finished) return;

            res.write(renderHtmlError(error));
            res.end();
          }
        );
      });
    });

    state.server.on('upgrade', (req, socket, head) => {
      socket.on('error', e => {
        socket.destroy();
      });
      lifecycle.wait().then(
        () => {
          // $FlowFixMe
          state.proxy.ws(req, socket, head, (/*e*/) => {
            socket.destroy();
          });
        },
        () => {
          // Destroy the socket to terminate the websocket request if the child process has issues
          socket.destroy();
        }
      );
    });

    // $FlowFixMe
    const listen = promisify(state.server.listen.bind(state.server));
    return listen(port).then(() => {
      const url = `http://localhost:${port}`;
      if (!noOpen) openUrl(url);

      // Return port in case it had to be changed
      return port;
    });
  };

  this.stop = () => {
    killProc();
    if (state.server) {
      state.server.close();
      state.server = null; // ensure we can call .run() again after stopping
    }
  };

  return this;
};

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(`\n${chalk.bold(question)} [Y/n]`, answer => {
      const response = answer === '' || answer.toLowerCase() === 'y';
      rl.close();
      resolve(response);
    });
  });
}

async function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      }
      reject(err);
    });
    server.once('listening',() =>  {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.listen(port);
  });
}
