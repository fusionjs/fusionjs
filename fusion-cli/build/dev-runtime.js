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

const renderError = require('./server-error').renderError;

// mechanism to allow a running proxy server to wait for a child process server to start
function Lifecycle() {
  const emitter = new EventEmitter();
  const state = {started: false, error: undefined};
  let listening = false;
  return {
    start: () => {
      state.started = true;
      emitter.emit('started');
    },
    stop: () => {
      state.started = false;
    },
    error: error => {
      state.error = error;
      // The error listener may emit before we call wait.
      // Make sure that we're listening before attempting to emit.
      if (listening) {
        emitter.emit('error');
      }
    },
    wait: () => {
      return new Promise((resolve, reject) => {
        if (state.started) resolve();
        else if (state.error) reject(state.error);
        else {
          listening = true;
          emitter.once('started', resolve);
          emitter.once('error', () => {
            listening = false;
            reject(state.error);
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
  } /*: any */
) /*: DevRuntimeType */ {
  const lifecycle = new Lifecycle();
  const state = {
    server: null,
    proc: null,
    proxy: null,
    childPortP: getPort(),
  };

  this.run = async function reloadProc() {
    const childPort = await state.childPortP;
    const command = `
      const fs = require('fs');
      const path = require('path');
      const chalk = require('chalk');

      const logErrors = e => {
        //eslint-disable-next-line no-console
        console.error(chalk.red(e.stack))
      }

      const logAndSend = e => {
        logErrors(e);
        process.send({event: 'error', payload: {
          message: e.message,
          name: e.name,
          stack: e.stack,
          type: e.type
        }});
      }

      const entry = path.resolve(
        ${JSON.stringify(dir)},
        '.fusion/dist/development/server/server-main.js'
      );

      if (fs.existsSync(entry)) {
        try {
          const {start} = require(entry);
          start({port: ${childPort}, dir: "${dir}"})
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

    killProc();

    return new Promise((resolve, reject) => {
      function handleChildServerCrash(err) {
        lifecycle.stop();
        reject(err);
      }
      const args = ['-e', command];
      if (debug) args.push('--inspect-brk');
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
  }

  this.start = async function start() {
    const childPort = await state.childPortP;

    state.proxy = httpProxy.createProxyServer({
      target: {
        host: 'localhost',
        port: childPort,
      },
    });

    // $FlowFixMe
    state.server = http.createServer((req, res) => {
      middleware(req, res, async () => {
        lifecycle.wait().then(
          () => {
            // $FlowFixMe
            state.proxy.web(req, res, e => {
              if (res.finished) return;

              res.write(renderError(e));
              res.end();
            });
          },
          error => {
            if (res.finished) return;

            res.write(renderError(error));
            res.end();
          }
        );
      });
    });

    // $FlowFixMe
    state.server.on('upgrade', (req, socket, head) => {
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
    });
  };

  this.stop = () => {
    killProc();
    if (state.server) {
      state.server.close();
      state.server = null; // ensure we can call .run() again after stopping
    }
    if (state.proxy) {
      state.proxy.close();
      state.proxy = null;
    }
  };

  return this;
};
