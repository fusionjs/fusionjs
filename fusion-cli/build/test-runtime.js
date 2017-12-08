/* eslint-env node */
const path = require('path');
const {spawn} = require('child_process');

module.exports.TestRuntime = function({
  dir = '.',
  cover = false,
  // This should only be set for dev.js cli command in which we explicitly want
  // the built NODE_ENV for tests ('production') to not match the process NODE_ENV ('development')
  overrideNodeEnv = false,
}) {
  const state = {proc: null};

  this.run = () => {
    this.stop();

    const base = '.fusion/dist/test';
    const server = path.resolve(dir, base, 'server/server-main.js');
    const client = path.resolve(dir, base, 'client/client-main.js');
    let command = require.resolve('unitest/bin/cli.js');
    let args = [`--browser=${client}`, `--node=${server}`];
    if (cover) {
      const unitest = command;
      command = require.resolve('nyc/bin/nyc.js');
      args = [
        '--reporter=text',
        '--reporter=html',
        '--reporter=cobertura',
        unitest,
        ...args,
      ];
    }

    return new Promise((resolve, reject) => {
      state.proc = spawn(command, args, {
        cwd: path.resolve(process.cwd(), dir),
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: Object.assign(
          {},
          process.env,
          overrideNodeEnv ? {NODE_ENV: 'production'} : {}
        ),
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
