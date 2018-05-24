/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {TestAppRuntime} = require('../build/test-runtime');

exports.desc = 'Run browser tests, using Jest';
exports.builder = {
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  debug: {
    type: 'boolean',
    default: false,
    describe: 'Debug tests',
  },
  watch: {
    type: 'boolean',
    default: false,
    describe: 'Automatically re-run tests on file changes',
  },
  match: {
    type: 'string',
    default: null,
    describe: 'Runs test files that match a given string',
  },
  env: {
    type: 'string',
    default: 'jsdom,node',
    describe:
      'Comma-separated list of environments to run tests in. Defaults to running both node and browser tests.',
  },
  testFolder: {
    type: 'string',
    default: '__tests__',
    describe: 'Which folder to look for tests in.',
  },
  updateSnapshot: {
    type: 'boolean',
    default: false,
    describe: 'Updates snapshots',
  },
  coverage: {
    type: 'boolean',
    default: false,
    describe: 'Runs test coverage',
  },
  configPath: {
    type: 'string',
    default: './node_modules/fusion-cli/build/jest/jest-config.js',
    describe: 'Path to the jest configuration',
  },
};

exports.run = async function(
  {
    dir = '.',
    watch,
    debug,
    match,
    env,
    testFolder,
    updateSnapshot,
    coverage,
    configPath,
    // Allow snapshots to be updated using `-u` as well as --updateSnapshot.
    // We don't document this argument, but since jest output automatically
    // suggests this as a valid argument, we support it in case it's used.
    u,
  } /*: any */
) {
  const testRuntime = new TestAppRuntime({
    dir,
    watch,
    debug,
    match,
    env,
    testFolder,
    updateSnapshot: updateSnapshot || u,
    coverage,
    configPath,
  });

  // $FlowFixMe
  await testRuntime.run();

  return {
    stop() {
      // $FlowFixMe
      testRuntime.stop();
    },
  };
};
