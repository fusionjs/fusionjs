/** Copyright (c) 2022 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const child_process = require('child_process');
const ChildServerError = require('./child-server-error.js');

/*::
type ChildServerOptions = {
  cwd: string,
  debug?: boolean,
  entryFilePath: string,
  onError?: (err?: Error) => void,
  port: number,
  useModuleScripts: boolean,
};
*/

class ChildServer {
  proc /*: child_process.ChildProcess */;
  options /*: ChildServerOptions */;
  chalkModulePath = require.resolve('chalk');
  serverErrorModulePath = require.resolve('./server-error.js');
  serverBuildHash = '';

  constructor(options /*: ChildServerOptions */) {
    this.options = options;
  }

  onReady() {
    throw new Error('Did not expect to receive another ready event from child');
  }

  onError(err /*: Error */) {
    if (this.options.onError) {
      this.options.onError(err);
    }
  }

  isStarted() {
    return Boolean(this._startPromise);
  }

  _onReadyHook = () => {};
  _onErrorHook = (err /*:? Error */) => {};
  getServerHookedUpPromise(execute /*: () => void */) {
    // $FlowFixMe[missing-annot]
    return new Promise((resolve, reject) => {
      this._onReadyHook = resolve;
      this._onErrorHook = reject;

      execute();
    }).finally(() => {
      this._onReadyHook = this.onReady;
      this._onErrorHook = this.onError;
    });
  }

  _startPromise = null;
  start(serverBuildHash /*: string */) {
    if (this._startPromise) {
      return this._startPromise;
    }

    // $FlowFixMe[missing-annot]
    return (this._startPromise = (this._stopPromise || Promise.resolve())
      .catch(() => {})
      .then(() =>
        this.getServerHookedUpPromise(() => {
          this._stopPromise = null;
          this.serverBuildHash = serverBuildHash;

          const handleChildError = (err) => {
            this.stop();
            this._onErrorHook(err);
          };

          const args = ['-e', this.getServerScript()];
          if (this.options.debug) {
            args.push('--inspect-brk');
          }
          this.proc = child_process.spawn('node', args, {
            cwd: this.options.cwd,
            stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
          });
          this.proc.on('error', (err) => {
            handleChildError(err);
          });
          this.proc.on('exit', (code, signal) => {
            const err = new Error(
              `Child process has exited unexpectedly, please check logs for an error. ${[
                code !== null && `Exit code was ${JSON.stringify(code)}`,
                signal !== null && `Signal was ${JSON.stringify(signal)}`,
              ]
                .filter(Boolean)
                .join('; ')}`
            );

            console.error(err);
            handleChildError(err);
          });
          this.proc.on('message', async (message) => {
            if (message.event === 'ready') {
              if (
                this.serverBuildHash ===
                (message.serverBuildHash || serverBuildHash)
              ) {
                this._onReadyHook();
              }

              return;
            }
            if (message.event === 'update-failed') {
              handleChildError(new Error('HMR Failed'));

              return;
            }
            if (message.event === 'error') {
              handleChildError(new ChildServerError(message.payload));

              return;
            }
          });
        })
      ));
  }

  update(serverBuildHash /*: string */) {
    if (this._stopPromise) {
      throw new Error('Can not update instance that has been stopped');
    }

    if (!this._startPromise) {
      throw new Error('Can not update instance that has not been started');
    }

    return this._startPromise.then(() => {
      return this.getServerHookedUpPromise(() => {
        this.serverBuildHash = serverBuildHash;

        this.proc.send({event: 'update', serverBuildHash});
      });
    });
  }

  _stopPromise = null;
  stop() {
    if (this._stopPromise) {
      return this._stopPromise;
    }

    if (!this._startPromise) {
      throw new Error('Can not stop instance that has not been started');
    }

    // $FlowFixMe[missing-annot]
    return (this._stopPromise = new Promise((resolve, reject) => {
      this._startPromise = null;

      this.proc.removeAllListeners();
      if (this.options.debug) {
        this.proc.on('error', reject);
        this.proc.on('exit', resolve);
        this.proc.kill('SIGKILL');
      } else {
        this.proc.kill();
        resolve();
      }
    }));
  }

  getServerScript() {
    return `
      process.on('SIGTERM', () => process.exit());
      process.on('SIGINT', () => process.exit());

      const fs = require('fs');
      const path = require('path');
      const chalk = require(${JSON.stringify(this.chalkModulePath)});
      const renderTerminalError = require(${JSON.stringify(
        this.serverErrorModulePath
      )}).renderTerminalError;

      const logErrors = global.__DEV_RUNTIME_LOG_ERROR__ = e => {
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

      const entry = path.resolve('${this.options.entryFilePath}');

      if (fs.existsSync(entry)) {
        try {
          const {start} = require(entry);
          start({
            port: ${this.options.port},
            useModuleScripts: ${JSON.stringify(this.options.useModuleScripts)},
          })
            .then(() => {
              process.send({event: 'ready'})
            })
            .catch(logAndSend); // handle server bootstrap errors (e.g. port already in use)
        } catch (e) {
          logAndSend(e); // handle app top level errors
        }
      } else {
        logAndSend(new Error(\`No entry found at \${entry}\`));
      }
    `;
  }
}

module.exports = ChildServer;
