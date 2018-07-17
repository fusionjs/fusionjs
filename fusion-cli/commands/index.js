// @flow
/* eslint-env node */
module.exports = {
  build: {
    descr: 'Build your app',
    options: {
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD',
      },
      test: {
        type: 'boolean',
        default: false,
        describe: 'Build test assets as well as development assets',
      },
      cover: {
        type: 'boolean',
        default: false,
        describe: 'Build tests (with coverage) as well as development assets',
      },
      production: {
        type: 'boolean',
        default: false,
        describe: 'Build production assets',
      },
      'log-level': {
        type: 'string',
        default: 'info',
        describe: 'Log level to show',
      },
    },
  },
  dev: {
    descr: 'Run your app in development',
    options: {
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD',
      },
      debug: {
        type: 'boolean',
        default: false,
        describe: 'Debug application',
      },
      port: {
        type: 'number',
        default: 3000,
        describe: 'The port at which the app runs',
      },
      open: {
        type: 'boolean',
        default: true,
        describe: 'Run without opening the url in your browser',
      },
      hmr: {
        type: 'boolean',
        default: true,
        describe: 'Run without hot module replacement',
      },
      'log-level': {
        type: 'string',
        default: 'info',
        describe: 'Log level to show',
      },
    },
  },
  profile: {
    descr: 'Profile your application',
    options: {
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD',
      },
      environment: {
        type: 'string',
        default: 'production',
        describe: 'Either `production` or `development`',
      },
      port: {
        type: 'number',
        default: '4000',
        describe: 'Port for the bundle analyzer server',
      },
    },
  },
  start: {
    descr: 'Run your app',
    options: {
      debug: {
        type: 'boolean',
        default: false,
        describe: 'Debug application',
      },
      port: {
        type: 'number',
        describe:
          'Port to start the server on. Defaults to process.env.PORT_HTTP || 3000',
      },
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD',
      },
      environment: {
        type: 'string',
        describe:
          "Which environment/assets to run - defaults to first available assets among ['development', 'production']",
      },
    },
  },
  'test-app': {},
  test: {
    descr: 'Run browser tests, using Jest',
    options: {
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
    },
  },
};
