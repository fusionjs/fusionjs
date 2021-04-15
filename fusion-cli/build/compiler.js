/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const chalk = require('chalk');
const webpackHotMiddleware = require('webpack-hot-middleware');
const rimraf = require('rimraf');

const webpackDevMiddleware = require('../lib/simple-webpack-dev-middleware');
const {getWebpackConfig} = require('./get-webpack-config.js');
const {
  DeferredState,
  SyncState,
  MergedDeferredState,
} = require('./shared-state-containers.js');
const mergeChunkMetadata = require('./merge-chunk-metadata');
const loadFusionRC = require('./load-fusionrc.js');

const Worker = require('jest-worker').default;

function ensureCompilerStatsInfo(stats) {
  return function handleErrorOrWarning(errorOrWarning) {
    return {
      compilerPath: stats.name,
      ...errorOrWarning,
    };
  }
}

function getErrors(info, depth = 0) {
  let errors = info.errors.map(ensureCompilerStatsInfo(info));
  if (info.children && info.children.length) {
    errors = errors.concat(
      info.children.reduce((x, child) => {
        return x.concat(getErrors(child, depth + 1));
      }, [])
    );
  }
  return depth === 0 ? dedupeErrors(errors) : errors;
}

function getWarnings(info, depth = 0) {
  let warnings = info.warnings.map(ensureCompilerStatsInfo(info));
  if (info.children && info.children.length) {
    warnings = warnings.concat(
      info.children.reduce((x, child) => {
        return x.concat(getWarnings(child, depth + 1));
      }, [])
    );
  }
  return depth === 0 ? dedupeErrors(warnings) : warnings;
}

function dedupeErrors(items) {
  const re = /BabelLoaderError(.|\n)+( {4}at transpile)/gim;
  const set = new Set(items.map(item => (
    [
      [
        `${item.compilerPath}:`,
        item.moduleName,
        item.loc,
      ]
        .filter(Boolean)
        .join(' '),
      item.message,
      ...(item.moduleTrace || [])
        .map(module => (
          [
            ` @ ${module.originName}`,
            ...(module.dependencies || [])
              .map(dep => dep.loc)
          ]
            .filter(Boolean)
            .join(' ')
        )),
      item.details
    ]
      .filter(Boolean)
      .join('\n')
      .replace(re, '$2')
  )));
  return Array.from(set);
}

function getStatsLogger({dir, logger, env}) {
  return (err, stats) => {
    // syntax errors are logged 4 times (once by webpack, once by babel, once on server and once on client)
    // we only want to log each syntax error once
    const isProd = env === 'production';

    if (err) {
      logger.error(err.stack || err);
      if (err.details) {
        logger.error(err.details);
      }
      return;
    }

    const file = path.resolve(dir, '.fusion/stats.json');
    const info = stats.toJson({
      // Note: need to reduce memory and disk space usage to help with some faulty builds (OOMs)
      children: {
        // None of the analyzers inspect child compilations, so we can keep it to a minimum
        children: {
          all: false,
          timings: true,
          builtAt: true,
          errors: true,
          errorsCount: true,
          errorDetails: true,
          errorStack: true,
          warnings: true,
          warningsCount: true,
        }
      },
      // No need to include all modules, as they are also grouped by chunk,
      // and this is enough for most bundle analyzers to generate report
      modules: false,
    });
    fs.writeFile(file, JSON.stringify(info, null, 2), () => {});

    // TODO(#13): These logs seem to be kinda noisy for dev.
    if (isProd) {
      info.children.forEach(child => {
        child.assets
          .slice()
          .filter(asset => {
            return !asset.name.endsWith('.map');
          })
          .sort((a, b) => {
            return b.size - a.size;
          })
          .forEach(asset => {
            logger.info(`Entrypoint: ${chalk.bold(child.name)}`);
            logger.info(`Asset: ${chalk.bold(asset.name)}`);
            logger.info(`Size: ${chalk.bold(asset.size)} bytes`);
          });
      });
    }

    if (stats.hasWarnings()) {
      getWarnings(info).forEach(e => logger.warn(e));
    }

    if (stats.hasErrors()) {
      getErrors(info).forEach(e => logger.error(e));
    }
  };
}

/*::
type CompilerType = {
  on: (type: any, callback: any) => any,
  start: (callback: any) => any,
  getMiddleware: () => any,
  clean: () => any,
};
*/

/*::
type CompilerOpts = {
  serverless?: boolean,
  dir?: string,
  env: "production" | "development",
  hmr?: boolean,
  watch?: boolean,
  forceLegacyBuild?: boolean,
  logger?: any,
  preserveNames?: boolean,
  minify?: boolean,
  modernBuildOnly?: boolean,
  maxWorkers?: number,
  skipSourceMaps?: boolean,
  command?: 'dev' | 'build',
  disableBuildCache?: boolean,
};
*/

function Compiler(
  {
    dir = '.',
    env,
    hmr = true,
    forceLegacyBuild,
    preserveNames,
    watch = false,
    logger = console,
    minify = true,
    serverless = false,
    modernBuildOnly = false,
    skipSourceMaps = false,
    maxWorkers,
    command,
    disableBuildCache,
  } /*: CompilerOpts */
) /*: CompilerType */ {
  const root = path.resolve(dir);
  const fusionConfig = loadFusionRC(root);
  const legacyPkgConfig = loadLegacyPkgConfig(root);

  const clientChunkMetadata = new DeferredState();
  const legacyClientChunkMetadata = new DeferredState();
  const legacyBuildEnabled = new SyncState(
    (forceLegacyBuild || !watch || env === 'production') &&
      !(modernBuildOnly || fusionConfig.modernBuildOnly)
  );
  const mergedClientChunkMetadata /*: any */ = new MergedDeferredState(
    [
      {deferred: clientChunkMetadata, enabled: new SyncState(true)},
      {deferred: legacyClientChunkMetadata, enabled: legacyBuildEnabled},
    ],
    mergeChunkMetadata
  );

  const state = {
    clientChunkMetadata,
    legacyClientChunkMetadata,
    mergedClientChunkMetadata,
    i18nManifest: new Map(),
    i18nDeferredManifest: new DeferredState(),
    legacyBuildEnabled,
  };

  let worker = createWorker(maxWorkers);

  const disableBuildCacheOption = typeof disableBuildCache === 'undefined'
    ? fusionConfig.disableBuildCache
    : disableBuildCache;
  const isBuildCacheEnabled = disableBuildCacheOption !== true

  const sharedOpts = {
    dir: root,
    dev: env === 'development',
    hmr,
    watch,
    state,
    fusionConfig,
    legacyPkgConfig,
    skipSourceMaps,
    preserveNames,
    // TODO: Remove redundant zopfli option
    zopfli: fusionConfig.zopfli != undefined ? fusionConfig.zopfli : true,
    gzip: fusionConfig.gzip != undefined ? fusionConfig.gzip : true,
    brotli: fusionConfig.brotli != undefined ? fusionConfig.brotli : true,
    isBuildCacheEnabled,
    minify,
    worker,
    command,
    onBuildEnd: fusionConfig.onBuildEnd,
  };
  const compiler = webpack([
    getWebpackConfig({id: 'client-modern', ...sharedOpts}),
    getWebpackConfig({
      id: serverless ? 'serverless' : 'server',
      ...sharedOpts,
    }),
  ]);
  if (process.env.LOG_END_TIME == 'true') {
    compiler.hooks.done.tap('BenchmarkTimingPlugin', stats => {
      /* eslint-disable-next-line no-console */
      console.log(`End time: ${Date.now()}`);
    });
  }

  if (watch) {
    compiler.hooks.watchRun.tap('StartWorkersAgain', () => {
      if (worker === void 0) worker = createWorker(maxWorkers);
    });
    compiler.hooks.watchClose.tap('KillWorkers', stats => {
      if (worker !== void 0) worker.end();
      worker = void 0;
    });
  } else
    compiler.hooks.done.tap('KillWorkers', stats => {
      if (worker !== void 0) worker.end();
      worker = void 0;
    });

  const statsLogger = getStatsLogger({dir, logger, env});

  this.on = (type, callback) => compiler.hooks[type].tap('compiler', callback);
  this.start = cb => {
    cb = cb || function noop(err, stats) {};
    // Handler may be called multiple times by `watch`
    // But only call `cb` the first time
    // subsequent rebuilds are subscribed to with 'compiler.on('done')'
    let hasCalledCb = false;
    const handler = (err, stats) => {
      statsLogger(err, stats);
      if (!hasCalledCb) {
        hasCalledCb = true;
        cb(err, stats);
      }
    };

    const watchOptions = compiler.options.map(options => options.watchOptions || {})
    if (watch) {
      return compiler.watch(watchOptions, handler);
    } else {
      compiler.run((err, stats) => {
        compiler.close(closeErr => {
          handler(err || closeErr, stats);
        })
      });
      // mimic watcher interface for API consistency
      return {
        close() {},
        invalidate() {},
      };
    }
  };

  this.getMiddleware = () => {
    const dev = webpackDevMiddleware(compiler);
    const hot = webpackHotMiddleware(compiler, {log: false});
    return (req, res, next) => {
      dev(req, res, err => {
        if (err) return next(err);
        return hot(req, res, next);
      });
    };
  };

  this.clean = () => {
    return new Promise((resolve, reject) => {
      // Need to persist build cache from previous builds
      rimraf(
        `${dir}/.fusion/${isBuildCacheEnabled ? '!(.build-cache)' : ''}`,
        e => (e ? reject(e) : resolve())
      );
    });
  };

  return this;
}

function loadLegacyPkgConfig(dir) {
  const appPkgJsonPath = path.join(dir, 'package.json');
  const legacyPkgConfig = {};
  if (fs.existsSync(appPkgJsonPath)) {
    // $FlowFixMe
    const appPkg = require(appPkgJsonPath);
    if (typeof appPkg.node !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        [
          `Warning: using a top-level "node" field in your app package.json to override node built-in shimming is deprecated.`,
          `Please use the "nodeBuiltins" field in .fusionrc.js instead.`,
          `See: https://github.com/fusionjs/fusion-cli/blob/master/docs/fusionrc.md#nodebuiltins`,
        ].join(' ')
      );
    }
    legacyPkgConfig.node = appPkg.node;
  }
  return legacyPkgConfig;
}

function createWorker(maxWorkers /* maxWorkers?: number */) {
  if (require('os').cpus().length < 2) return void 0;
  return new Worker(require.resolve('./loaders/babel-worker.js'), {
    exposedMethods: ['runTransformation'],
    forkOptions: {stdio: 'inherit'},
    numWorkers: maxWorkers,
  });
}

module.exports.Compiler = Compiler;
