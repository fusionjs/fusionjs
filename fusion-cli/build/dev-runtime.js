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
const {execSync} = require('child_process');
const {promisify} = require('util');
const openUrl = require('react-dev-utils/openBrowser');
const httpProxy = require('http-proxy');
const net = require('net');
const readline = require('readline');
const chalk = require('chalk');
const ChildServer = require('./child-server.js');

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
      state.error = undefined;
    },
    error: (error) => {
      state.started = false;
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
  run: (serverBuildHash?: string) => any,
  start: () => any,
  stop: () => any,
  invalidate: () => void
};

type DevRuntimeState = {
  isInvalid: boolean,
  server: ?http.Server,
  childServer: ?ChildServer,
  proxy: ?httpProxy,
};
*/

module.exports.DevelopmentRuntime = function (
  {
    port,
    dir = '.',
    noOpen,
    middleware = (req, res, next) => next(),
    debug = false,
    disablePrompts = false,
    experimentalSkipRedundantServerReloads,
    logger,
    serverHmr,
    useModuleScripts = false,
  } /*: any */
) /*: DevRuntimeType */ {
  const lifecycle = new Lifecycle();
  const state /*: DevRuntimeState */ = {
    isInvalid: true,
    server: null,
    childServer: null,
    proxy: null,
  };

  function onChildServerReady() {
    // No point to resume at this point, as there's another compilation in progress
    if (state.isInvalid) {
      return;
    }

    lifecycle.start();
  }

  function onChildServerError(err) {
    if (state.isInvalid) {
      return;
    }

    lifecycle.error(err);
    logger.error(
      'Server has crashed, please check logs for an error (type `r` in console to restart the server)'
    );
  }

  let childServerInitPromise = null;
  function initChildServer() {
    if (childServerInitPromise) {
      return childServerInitPromise;
    }

    return (childServerInitPromise = getPort().then((childPort) => {
      childServerInitPromise = null;

      state.childServer = new ChildServer({
        cwd: path.resolve(process.cwd(), dir),
        debug,
        entryFilePath: entryFile,
        onError: onChildServerError,
        port: childPort,
        useModuleScripts,
      });

      state.proxy = httpProxy.createProxyServer({
        agent: new http.Agent({keepAlive: true}),
        target: {
          host: 'localhost',
          port: childPort,
        },
      });
    }));
  }

  this.run = async function reloadProc(serverBuildHash = '') {
    state.isInvalid = false;

    if (!serverHmr) {
      const fpath = path.join(dir, entryFile);
      if (experimentalSkipRedundantServerReloads && (await exists(fpath))) {
        const entryFileStats = await stat(fpath);
        if (
          entryFileStats.mtime.toString() ===
            entryFileLastModifiedTime.toString() &&
          state.childServer &&
          state.childServer.isStarted() &&
          state.proxy
        ) {
          logger.info('Server bundle not changed, skipping server restart.');
          onChildServerReady();

          return;
        } else {
          entryFileLastModifiedTime = entryFileStats.mtime;
        }
      }

      if (state.childServer) {
        await killProc();
      }
    }

    if (!state.childServer) {
      await initChildServer();
    }

    // $FlowFixMe[incompatible-use]
    if (serverHmr && state.childServer.isStarted()) {
      return (
        state.childServer
          // $FlowFixMe[incompatible-use]
          .update(serverBuildHash)
          .catch(() => {
            logger.warn('HMR Failed. Attempting full server reload...');

            // $FlowFixMe[incompatible-use]
            return state.childServer.start(serverBuildHash);
          })
          .then(onChildServerReady)
          .catch((err) => {
            onChildServerError(err);

            throw err;
          })
      );
    } else {
      return (
        state.childServer
          // $FlowFixMe[incompatible-use]
          .start(serverBuildHash)
          .then(onChildServerReady)
          .catch((err) => {
            onChildServerError(err);

            throw err;
          })
      );
    }
  };

  this.invalidate = () => {
    state.isInvalid = true;
    lifecycle.stop();
  };

  async function killProc() {
    if (state.proxy) {
      state.proxy.close();
      state.proxy = null;
    }

    if (state.childServer) {
      try {
        await state.childServer.stop();
      } catch (err) {} // eslint-disable-line

      state.childServer = null;
    }
  }

  let isRestarting = false;
  this.handleTerminalInput = async (data) => {
    const input = data.toString().trim();

    if (input === 'r') {
      if (isRestarting) {
        logger.warn('Another restart in progress...');
        return;
      }
      isRestarting = true;

      logger.info('Restarting the server...');
      lifecycle.stop();

      try {
        await killProc();
        await this.run();

        logger.info('Server has been restarted');
      } catch (err) {} // eslint-disable-line

      isRestarting = false;
    }
  };

  this.start = async function start() {
    if (debug) {
      // make the default node debug port available for attaching
      // by killing the previously attached process
      try {
        execSync(
          "lsof -n -i:9229 | grep node | awk '{print $2}' | xargs -r kill -9"
        );
      } catch (err) {} // eslint-disable-line
    }

    const portAvailable = await isPortAvailable(port);
    if (!portAvailable) {
      if (disablePrompts) {
        // Fast fail, don't prompt
        throw new Error(`Port ${port} taken by another process`);
      }
      const useRandomPort = await prompt(
        `Port ${port} taken! Continue with a different port?`
      );
      if (useRandomPort) {
        let ports = [];
        for (let i = 1; i <= 10; i++) {
          ports.push(port + i);
        }
        port = await getPort({port: ports});
      }
    }

    state.server = http.createServer((req, res) => {
      middleware(req, res, async () => {
        function handleError(err) {
          if (res.finished) return;

          if (!res.headersSent) {
            res.statusCode = 500;
          }
          res.write(renderHtmlError(err));
          res.end();
        }

        function passThrough(onError = handleError) {
          // $FlowFixMe[incompatible-use]
          return state.proxy.web(req, res, onError);
        }

        lifecycle.wait().then(passThrough, handleError);
      });
    });

    state.server.on('upgrade', (req, socket, head) => {
      socket.on('error', (err) => {
        socket.destroy();
      });
      lifecycle.wait().then(
        () => {
          // $FlowFixMe[incompatible-use]
          state.proxy.ws(req, socket, head, () => {
            socket.destroy();
          });
        },
        () => {
          // Destroy the socket to terminate the websocket request if the child process has issues
          socket.destroy();
        }
      );
    });

    // $FlowFixMe[incompatible-use]
    const listen = promisify(state.server.listen.bind(state.server));
    return listen(port).then(() => {
      const url = `http://localhost:${port}`;
      if (!noOpen) openUrl(url);

      if (process.stdin.isTTY) {
        process.stdin.on('data', this.handleTerminalInput);
      }

      // Return port in case it had to be changed
      return port;
    });
  };

  this.stop = async () => {
    process.stdin.off('data', this.handleTerminalInput);
    if (state.server) {
      state.server.close();
      state.server = null; // ensure we can call .run() again after stopping
    }

    await killProc();
  };

  return this;
};

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`\n${chalk.bold(question)} [Y/n]`, (answer) => {
      const response = answer === '' || answer.toLowerCase() === 'y';
      rl.close();
      resolve(response);
    });
  });
}

async function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      }
      reject(err);
    });
    server.once('listening', () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.listen(port);
  });
}
