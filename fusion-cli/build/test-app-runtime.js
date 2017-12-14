/* eslint-env node */
const path = require('path');
const {spawn} = require('child_process');

module.exports.TestAppRuntime = function({
  dir = '.',
  watch = false,
  match,
  configPath,
}) {
  const state = {proc: null};

  this.run = () => {
    this.stop();
    let command = require.resolve('jest-cli/bin/jest.js');
    let args = ['--config', configPath];

    if (watch) {
      args.push('--watch');
    }

    if (match && match.length > 0) {
      args.push(match);
    }

    return new Promise((resolve, reject) => {
      state.proc = spawn(command, args, {
        cwd: path.resolve(process.cwd(), dir),
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: Object.assign({}, process.env),
      });

      state.proc.on('error', reject);
      state.proc.on('exit', (code, signal) => {
        if (code) {
          return reject(new Error(`Test exited with code ${code}`));
        }

        if (signal) {
          return reject(new Error(`Test process exited with signal ${signal}`));
        }

        return resolve();
      });
    });
  };

  this.stop = () => {
    if (state.proc) {
      state.proc.kill();
      state.proc = null;
    }
  };
};
