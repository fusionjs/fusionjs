/* eslint-env node */
const {TestAppRuntime} = require('../build/test-app-runtime');

exports.desc = 'Run browser tests, using Jest';
exports.builder = {
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
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
  configPath: {
    type: 'string',
    default: './node_modules/fusion-cli/build/jest-config.js',
    describe: 'Path to the jest configuration',
  },
};

exports.run = async function({dir = '.', watch, match, env, configPath}) {
  const testRuntime = new TestAppRuntime({dir, watch, match, env, configPath});

  await testRuntime.run();

  return {
    stop() {
      testRuntime.stop();
    },
  };
};
