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

function getChildUrl(originalUrl, replacement) {
  const parsedUrl = Object.assign(url.parse(originalUrl), replacement);
  return url.format(parsedUrl);
}

// mechanism to allow a running proxy server to wait for a child process server to start
function Lifecycle() {
  const emitter = new EventEmitter();
  const state = {started: false};
  return {
    start: () => {
      state.started = true;
      emitter.emit('started');
    },
    stop: () => {
      state.started = false;
    },
    wait: () => {
      return new Promise(resolve => {
        if (state.started) resolve();
        else emitter.once('started', resolve);
      });
    },
  };
}

module.exports.DevelopmentRuntime = function({
  port,
  dir = '.',
  noOpen,
  middleware = (req, res, next) => next(),
  debug = false,
}) {
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
        process.send('error');
      }

      const entry = path.resolve(
        ${JSON.stringify(dir)},
        '.fusion/dist/development/server/server-main.js'
      );

      if (fs.existsSync(entry)) {
        try {
          const {start} = require(entry);
          start({port: ${childPort}})
            .then(() => {
              process.send('started')
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
      state.proc = spawn('node', args, {
        cwd: path.resolve(process.cwd(), dir),
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      });
      state.proc.on('error', handleChildServerCrash);
      state.proc.on('exit', handleChildServerCrash);
      state.proc.on('message', message => {
        if (message === 'started') {
          lifecycle.start();
          resolve();
        }
        if (message === 'error') {
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
    state.server = http.createServer((req, res) => {
      middleware(req, res, async () => {
        const childPort = await state.childPortP;

        lifecycle.wait().then(function retry() {
          const newUrl = getChildUrl(req.url, {
            protocol: 'http',
            hostname: 'localhost',
            port: childPort,
          });
          const proxyReq = request(newUrl);
          proxyReq.on('error', retry);
          req.pipe(proxyReq).pipe(res);
        });
      });
    });
    const listen = promisify(state.server.listen.bind(state.server));
    return listen(port).then(() => {
      const url = `http://localhost:${port}`;
      console.log(`Server listening at ${url}`); // eslint-disable-line
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
};
