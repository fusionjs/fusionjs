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
const {execSync: exec} = require('child_process');

exports.run = async function (
  {
    analyze,
    dir = '.',
    test,
    debug,
    forceLegacyBuild = false,
    port,
    hmr,
    open,
    logLevel,
    disablePrompts,
    exitOnError,
    disableBuildCache,
    experimentalSkipRedundantServerReloads,
    stats,
    unsafeCache,
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
    forceLegacyBuild,
    watch: true,
    logger,
    disableBuildCache,
    stats,
    unsafeCache,
  });

  const devRuntime = new DevelopmentRuntime(
    // $FlowFixMe
    Object.assign(
      {
        dir,
        port,
        debug,
        noOpen: !open,
        disablePrompts,
        experimentalSkipRedundantServerReloads,
      },
      hmr ? {middleware: compiler.getMiddleware()} : {}
    )
  );

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
        devRuntime.run(),
        // $FlowFixMe
        testRuntime ? testRuntime.run() : Promise.resolve(),
      ]);
      if (!open) {
        logger.info(`Application is running on http://localhost:${actualPort}`);
      }
    } catch (e) {} // eslint-disable-line
  };

  const watcher = await new Promise((resolve, reject) => {
    const watcher = compiler.start((err, stats) => {
      // Rerun for each recompile
      compiler.on('done', () => {
        if (debug) {
          // make the default node debug port available for attaching by killing the
          // old attached process
          try {
            exec("kill -9 $(lsof -n -i:9229 | grep node | awk '{print $2}')");
          } catch (e) {} // eslint-disable-line
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
          return resolve(watcher);
        }
      }
      return runAll().then(() => resolve(watcher));
    });
  });

  function stop() {
    watcher.close();
    devRuntime.stop();
    // $FlowFixMe
    if (testRuntime) testRuntime.stop();
  }

  process.on('SIGTERM', () => {
    stop();
  });

  return {
    compiler,
    stop,
  };
};
