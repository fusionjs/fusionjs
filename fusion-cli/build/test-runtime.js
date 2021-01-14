/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const path = require('path');
const {spawn} = require('child_process');
const rimraf = require('rimraf');

const convertCoverage = require('./convert-coverage');

module.exports.TestAppRuntime = function(
  {
    dir = '.',
    debug = false,
    match,
    env,
    testFolder, // deprecated
    testMatch,
    testRegex,
    updateSnapshot,
    collectCoverageFrom,
    configPath = `${__dirname}/jest/jest-config.js`,
    jestArgs = {},
  } /*: any */
) {
  const state = {procs: []};
  const rootDir = path.resolve(process.cwd(), dir);

  this.run = () => {
    this.stop();
    const getArgs = () => {
      let args = [require.resolve('jest/bin/jest.js')];
      if (debug) {
        args = [
          '--inspect-brk',
          require.resolve('jest/bin/jest.js'),
          '--runInBand',
          // --no-cache is required to allow debugging from vscode
          '--no-cache',
        ];
      }

      args = args.concat(['--config', configPath]);

      if (jestArgs.noVerbose) {
        delete jestArgs.noVerbose;
      } else {
        args.push('--verbose');
      }

      Object.keys(jestArgs).forEach(arg => {
        const value = jestArgs[arg];
        if (value && typeof value === 'boolean') {
          args.push(`--${arg}`);
        }
        if (typeof value === 'number' || typeof value === 'string') {
          args.push(`--${arg}="${value}"`);
        }
      });

      if (match && match.length > 0) {
        args.push(match);
      }
      return args;
    };

    const setup = () => {
      if (!jestArgs.coverage) {
        return Promise.resolve();
      }

      // Remove existing coverage directories
      const folders = [`${rootDir}/coverage/`];
      return Promise.all(
        folders.map(folder => new Promise(resolve => rimraf(folder, resolve)))
      );
    };

    const spawnProc = () => {
      return new Promise((resolve, reject) => {
        const args = getArgs();
        const procEnv = {
          JEST_ENV: env,
          TEST_FOLDER: testFolder, // deprecated
          TEST_MATCH: testMatch,
          TEST_REGEX: testRegex,
          COVERAGE_PATHS: collectCoverageFrom,
        };
        const proc = spawn('node', args, {
          cwd: rootDir,
          stdio: 'inherit',
          env: Object.assign(procEnv, process.env),
        });
        proc.on('error', reject);
        proc.on('exit', (code, signal) => {
          if (code) {
            return reject(new Error(`Test exited with code ${code}`));
          }

          if (signal) {
            return reject(
              new Error(`Test process exited with signal ${signal}`)
            );
          }

          return resolve();
        });
        state.procs.push(proc);
      });
    };

    const finish = () => {
      if (!jestArgs.coverage) {
        return Promise.resolve();
      }
      return convertCoverage(rootDir);
    };

    return setup()
      .then(spawnProc)
      .then(finish);
  };

  this.stop = () => {
    if (state.procs.length) {
      state.procs.forEach(proc => proc.kill());
      state.procs = [];
    }
  };
};
