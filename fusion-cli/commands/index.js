// @flow
/* eslint-env node */

const {allowedJestOptions} = require('../build/jest/cli-options');

const jestOptionsDescriptions = {};
allowedJestOptions.forEach(arg => {
  jestOptionsDescriptions[arg] = {
    type: 'boolean',
    describe:
      'Jest CLI argument. See: https://jestjs.io/docs/en/cli.html#' +
      arg.toLowerCase(),
  };
});

const disableBuildCacheOption = {
  disableBuildCache: {
    type: 'boolean',
    default: undefined,
    describe: 'Disable persistent build cache.'
  }
};

module.exports = {
  build: {
    descr: 'Build your app',
    options: {
      experimentalServerless: {
        type: 'boolean',
        default: false,
        describe: 'Build a serverless entry',
      },
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD',
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
      preserveNames: {
        type: 'boolean',
        default: false,
        describe: 'Disable name mangling during script minification',
      },
      modernBuildOnly: {
        type: 'boolean',
        default: false,
        describe:
          'Build the application only for modern browsers. Will serve the modern bundles on legacy browsers.',
      },
      skipSourceMaps: {
        type: 'boolean',
        default: false,
        describe: 'Build without source maps.',
      },
      ...disableBuildCacheOption,
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
      exitOnError: {
        type: 'boolean',
        default: false,
        describe: 'Exits the development server if an error occurs.',
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
      forceLegacyBuild: {
        type: 'boolean',
        default: false,
        describe: 'Force enable legacy build. By default not compiled in dev.',
      },
      'log-level': {
        type: 'string',
        default: 'info',
        describe: 'Log level to show',
      },
      disablePrompts: {
        type: 'boolean',
        default: false,
        describe: 'Disable command-line prompts',
      },
      experimentalSkipRedundantServerReloads: {
        type: 'boolean',
        default: false,
        describe: 'Skip server respawn when server bundle does not change',
      },
      ...disableBuildCacheOption,
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
      ...disableBuildCacheOption,
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
      collectCoverageFrom: {
        type: 'string',
        default: null,
        describe:
          'Comma-separated list of coverage globs added to the Fusion.js default list. You can ignore a path via: !**/path/to/file.js',
      },
      dir: {
        type: 'string',
        default: '.',
        describe: 'Root path for the application relative to CLI CWD.',
      },
      debug: {
        type: 'boolean',
        default: false,
        describe: 'Debug tests using --inspect-brk and --runInBand.',
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
        default: '',
        describe:
          'Which folder to look for tests in. Deprecated, use testMatch or testRegex instead.',
      },
      testMatch: {
        type: 'string',
        default: '',
        describe:
          'Which folder to look for tests in. A JSON array of glob patterns.',
      },
      testRegex: {
        type: 'string',
        default: '',
        describe:
          'Which folder to look for tests in. A JSON array of regexp strings.',
      },
      configPath: {
        type: 'string',
        describe: 'Path to the jest configuration, used for testing.',
      },
      ...jestOptionsDescriptions,
    },
  },
};
