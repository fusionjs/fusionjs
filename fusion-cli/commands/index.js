// @flow
/* eslint-env node */

const {allowedJestOptions} = require('../build/jest/cli-options');
const {
  STATS_VERBOSITY_LEVELS,
} = require('../build/constants/compiler-stats.js');

const jestOptionsDescriptions = {};
allowedJestOptions.forEach((arg) => {
  jestOptionsDescriptions[arg] = {
    type: 'boolean',
    describe:
      'Jest CLI argument. See: https://jestjs.io/docs/en/cli.html#' +
      arg.toLowerCase(),
  };
});

const analyzeOption = {
  analyze: {
    type: 'string',
    default: undefined,
    describe: `Run bundle analyzer for targeted build (client, server)`,
  },
};

const disableBuildCacheOption = {
  disableBuildCache: {
    type: 'boolean',
    default: undefined,
    describe: 'Disable persistent build cache.',
  },
};

const experimentalEsbuildMinifierOption = {
  experimentalEsbuildMinifier: {
    type: 'boolean',
    default: undefined,
    describe: '[Experimental] Enable esbuild minifier (instead of Terser)',
  },
};

const statsOption = {
  stats: {
    type: 'string',
    default: STATS_VERBOSITY_LEVELS.minimal,
    describe: `Control verbosity level of build stats output (${Object.keys(
      STATS_VERBOSITY_LEVELS
    ).join(', ')})`,
  },
};

const moduleScriptsOption = {
  useModuleScripts: {
    type: 'boolean',
    default: false,
    describe:
      'Use <script type="module"> and <script nomodule> loading instead of user-agent checks',
  },
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
      minify: {
        type: 'boolean',
        default: true,
        describe: 'Minify scripts while bundling scripts',
      },
      ...analyzeOption,
      ...disableBuildCacheOption,
      ...experimentalEsbuildMinifierOption,
      ...statsOption,
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
      unsafeCache: {
        type: 'boolean',
        default: false,
        describe:
          "Use webpack's unsafeCache to boost incremental build performance. Any filesystem alterations affecting module resolution will be ignored, and require dev process restart",
      },
      experimentalSkipRedundantServerReloads: {
        type: 'boolean',
        default: false,
        describe: 'Skip server respawn when server bundle does not change',
      },
      serverHmr: {
        type: 'boolean',
        default: false,
        describe: '[Experimental] Enable HMR for the server bundle',
      },
      ...analyzeOption,
      ...disableBuildCacheOption,
      ...statsOption,
      ...moduleScriptsOption,
    },
  },
  profile: {
    descr:
      'Deprecated: You can use `--analyze` option with `build` or `dev` command instead',
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
      ...moduleScriptsOption,
    },
  },
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
