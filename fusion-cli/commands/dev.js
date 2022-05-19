/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const winston = require('winston');

const {Compiler} = require('../build/compiler');
const {DevelopmentRuntime} = require('../build/dev-runtime');

const TERMINATION_GRACE_PERIOD = process.env.FUSION_CLI_TERMINATION_GRACE_PERIOD
  ? parseInt(process.env.FUSION_CLI_TERMINATION_GRACE_PERIOD)
  : Infinity;

exports.run = async function (
  {
    analyze,
    dir = '.',
    test,
    debug,
    forceLegacyBuild = false,
    port,
    hmr,
    serverHmr,
    open,
    logLevel,
    disablePrompts,
    exitOnError,
    disableBuildCache,
    experimentalSkipRedundantServerReloads,
    stats,
    unsafeCache,
    useModuleScripts = false,
  } /*: any */
) {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  });
  logger.add(new winston.transports.Console({level: logLevel}));

  const compiler = new Compiler({
    analyze,
    command: 'dev',
    env: 'development',
    dir,
    hmr,
    serverHmr,
    forceLegacyBuild,
    watch: true,
    logger,
    disableBuildCache,
    stats,
    unsafeCache,
  });

  const middleware = hmr ? compiler.getMiddleware() : void 0;

  const devRuntime = new DevelopmentRuntime({
    dir,
    port,
    debug,
    noOpen: !open,
    disablePrompts,
    experimentalSkipRedundantServerReloads,
    logger,
    middleware,
    serverHmr,
    useModuleScripts,
  });

  let testRuntime = null;
  if (test) {
    const {TestAppRuntime} = require('../build/test-runtime');
    testRuntime = new TestAppRuntime({dir, overrideNodeEnv: true});
  }

  const [actualPort] = await Promise.all([
    devRuntime.start(),
    compiler.clean(),
  ]);

  const runAll = async () => {
    try {
      await Promise.all([
        devRuntime.run(compiler.getCompilationHash('server')),
        // $FlowFixMe
        testRuntime ? testRuntime.run() : Promise.resolve(),
      ]);
      if (!open) {
        logger.info(`Application is running on http://localhost:${actualPort}`);
      }
    } catch (e) {} // eslint-disable-line
  };

  await new Promise((resolve, reject) => {
    compiler.start((err, stats) => {
      // Rerun for each recompile
      compiler.on('done', (stats) => {
        if (stats.hasErrors()) {
          return;
        }

        runAll();
      });
      compiler.on('invalid', () => devRuntime.invalidate());

      if (err || stats.hasErrors()) {
        if (exitOnError) {
          return reject(
            new Error('Compilation error exiting due to exitOnError parameter.')
          );
        } else {
          return resolve();
        }
      }

      runAll();
      resolve();
    });
  });

  async function stop(onClose /*: () => void */) {
    await Promise.allSettled([
      middleware && middleware.close(),
      devRuntime.stop(),
      // $FlowFixMe
      testRuntime && testRuntime.stop(),
      new Promise((resolve) => {
        compiler.close(resolve);
      }),
    ]);

    onClose();
  }

  const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'];
  let forceExit = false;
  EXIT_SIGNALS.forEach((signal) => {
    process.on(signal, function onSignalExit() {
      function exit(exitCode = 0) {
        EXIT_SIGNALS.forEach((signal) => process.off(signal, onSignalExit));
        process.exit(exitCode);
      }

      if (forceExit || TERMINATION_GRACE_PERIOD === 0) {
        return exit(1);
      }
      // User may force exit by sending termination signal a second time
      forceExit = true;

      console.log(
        '\nGracefully shutting down... To force exit the process, press ^C again\n'
      );

      // Force exit should compiler take long time to close
      if (Number.isFinite(TERMINATION_GRACE_PERIOD)) {
        setTimeout(function () {
          exit(1);
        }, TERMINATION_GRACE_PERIOD);
      }
      stop(exit);
    });
  });

  return {
    compiler,
    stop,
  };
};
