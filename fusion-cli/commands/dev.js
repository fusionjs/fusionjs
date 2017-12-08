/* eslint-env node */
const winston = require('winston');
const {Compiler} = require('../build/compiler');
const {DevelopmentRuntime} = require('../build/dev-runtime');
const {TestRuntime} = require('../build/test-runtime');

exports.command =
  'dev [--dir] [--debug] [--test] [--cover] [--port] [--no-open] [--no-hmr] [--log-level]';
exports.describe = 'Run your app in development';
exports.builder = {
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
  open: {
    // yargs generates no-open option
    type: 'boolean',
    default: true,
    describe: 'Run without opening the url in your browser',
  },
  hmr: {
    // yargs generates no-hmr option
    type: 'boolean',
    default: true,
    describe: 'Run without hot module replacement',
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
  hmr,
  open,
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
    watch: hmr,
    cover,
    logger,
  });

  const devRuntime = new DevelopmentRuntime(
    Object.assign(
      {
        dir,
        port,
        debug,
        noOpen: !open,
      },
      hmr ? {middleware: compiler.getMiddleware()} : {}
    )
  );

  const testRuntime = test
    ? new TestRuntime({dir, overrideNodeEnv: true})
    : null;

  await Promise.all([devRuntime.start(), compiler.clean(dir)]);

  const runAll = async () => {
    try {
      await Promise.all([
        devRuntime.run(),
        testRuntime ? testRuntime.run() : Promise.resolve(),
      ]);
    } catch (e) {} // eslint-disable-line
  };

  const watcher = await new Promise(resolve => {
    const watcher = compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return resolve(watcher);
      }
      return runAll().then(() => resolve(watcher));
    });
  });

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
