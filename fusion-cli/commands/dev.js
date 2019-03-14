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
const {TestAppRuntime} = require('../build/test-runtime');

exports.run = async function(
  {
    dir = '.',
    test,
    debug,
    forceLegacyBuild = false,
    port,
    hmr,
    open,
    logLevel,
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
    env: 'development',
    dir,
    hmr,
    forceLegacyBuild,
    watch: true,
    logger,
  });

  const devRuntime = new DevelopmentRuntime(
    // $FlowFixMe
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
    ? new TestAppRuntime({dir, overrideNodeEnv: true})
    : null;

  // $FlowFixMe
  await Promise.all([devRuntime.start(), compiler.clean(dir)]);

  const runAll = async () => {
    try {
      await Promise.all([
        devRuntime.run(),
        // $FlowFixMe
        testRuntime ? testRuntime.run() : Promise.resolve(),
      ]);
      if (!open) {
        logger.info(`Application is running on http://localhost:${port}`);
      }
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
  compiler.on('invalid', () => devRuntime.invalidate());

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
