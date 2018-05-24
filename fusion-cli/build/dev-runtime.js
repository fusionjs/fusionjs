/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const url = require('url');
const path = require('path');
const http = require('http');
const request = require('request');
const EventEmitter = require('events');
const getPort = require('get-port');
const {spawn} = require('child_process');
const {promisify} = require('util');
const openUrl = require('react-dev-utils/openBrowser');

const renderError = require('./server-error').renderError;

function getChildUrl(originalUrl, replacement) {
  const parsedUrl = Object.assign(url.parse(originalUrl), replacement);
  return url.format(parsedUrl);
}

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

  function killProc() {
    if (state.proc) {
      lifecycle.stop();
      state.proc.removeAllListeners();
      state.proc.kill();
      state.proc = null;
    }
  }

  this.start = () => {
    // $FlowFixMe
    state.server = http.createServer((req, res) => {
      middleware(req, res, async () => {
        const childPort = await state.childPortP;
        lifecycle.wait().then(
          function retry() {
            const newUrl = getChildUrl(req.url, {
              protocol: 'http',
              hostname: 'localhost',
              port: childPort,
            });
            const proxyReq = request(newUrl, {
              // let the browser follow the redirect
              followRedirect: false,
            });
            proxyReq.on('error', retry);
            req.pipe(proxyReq).pipe(res);
          },
          error => {
            res.write(renderError(error));
            res.end();
          }
        );
      });
    });
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
  };

  return this;
};
