/* eslint-env node */
const winston = require('winston');
const {Compiler} = require('../build/compiler');
const {DevelopmentRuntime} = require('../build/dev-runtime');
const {TestRuntime} = require('../build/test-runtime');

exports.command = 'dev [dir]';
exports.describe = 'Run your app in development';
exports.builder = {
  cover: {
    type: 'boolean',
    default: false,
    describe: 'Run tests (with coverage) as well as your application',
  },
  debug: {
    type: 'boolean',
    default: false,
    describe: 'Debug application',
  },
  'no-open': {
    type: 'boolean',
    default: false,
    describe: 'Run without opening the url in your browser',
  },
  'no-hmr': {
    type: 'boolean',
    default: false,
    describe: 'Run without hot module replacement',
  },
  test: {
    type: 'boolean',
    default: false,
    describe: 'Run tests as well as your application',
  },
  // TODO(#18): support watch-mode `dev --profile`
  // profile: {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Run profiling as well as your application',
  // },
  // TODO(#19): support dev with production assets
  // production: {
  //   type: 'boolean',
  //   default: false,
  //   describe: 'Run with production assets and NODE_ENV',
  // },
  port: {
    type: 'number',
    default: 3000,
    describe: 'The port at which the app runs',
  },
  'log-level': {
    type: 'string',
    default: 'info',
    describe: 'Log level to show',
  },
};

exports.run = async function({
  dir = '.',
  test,
  debug,
  port,
  cover,
  noHmr,
  noOpen,
  logLevel,
}) {
  const logger = new winston.Logger({
    transports: [
      new winston.transports.Console({colorize: true, level: logLevel}),
    ],
  });

  const compiler = new Compiler({
    envs: test ? ['development', 'test'] : ['development'],
    dir,
    watch: !noHmr,
    cover,
    logger,
  });

  const devRuntime = new DevelopmentRuntime(
    Object.assign(
      {
        dir,
        port,
        debug,
        noOpen,
      },
      !noHmr ? {middleware: compiler.getMiddleware()} : {}
    )
  );

  const testRuntime = test
    ? new TestRuntime({dir, overrideNodeEnv: true})
    : null;

  await Promise.all([devRuntime.start(), compiler.clean(dir)]);

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }

      return resolve(watcher);
    });
  });

  const runAll = async () => {
    try {
      await Promise.all([
        devRuntime.run(),
        testRuntime ? testRuntime.run() : Promise.resolve(),
      ]);
    } catch (e) {} // eslint-disable-line
  };

  // Run for the first time after the above compilation
  await runAll();

  // Rerun for each recompile
  compiler.on('done', runAll);

  return {
    compiler,
    stop() {
      watcher.close();
      devRuntime.stop();
      if (testRuntime) testRuntime.stop();
    },
  };
};
