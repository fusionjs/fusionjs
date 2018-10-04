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
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const webpackDevMiddleware = require('../lib/simple-webpack-dev-middleware');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const {
  zopfliWebpackPlugin,
  brotliWebpackPlugin,
  //pngquantWebpackPlugin,
  //guetzliWebpackPlugin,
  svgoWebpackPlugin,
} = require('../lib/compression');
const resolveFrom = require('resolve-from');

const getBabelConfig = require('./get-babel-config.js');
const LoaderContextProviderPlugin = require('./plugins/loader-context-provider-plugin.js');
const {
  chunkIdsLoader,
  fileLoader,
  babelLoader,
  i18nManifestLoader,
  chunkUrlMapLoader,
  syncChunkIdsLoader,
  syncChunkPathsLoader,
} = require('./loaders/index.js');
const {DeferredState} = require('./shared-state-containers.js');
const {
  translationsManifestContextKey,
  clientChunkMetadataContextKey,
  devContextKey,
} = require('./loaders/loader-context.js');
const ClientChunkMetadataStateHydratorPlugin = require('./plugins/client-chunk-metadata-state-hydrator-plugin.js');
const InstrumentedImportDependencyTemplatePlugin = require('./plugins/instrumented-import-dependency-template-plugin');
const I18nDiscoveryPlugin = require('./plugins/i18n-discovery-plugin.js');
const chalk = require('chalk');
const webpackHotMiddleware = require('webpack-hot-middleware');
const loadFusionRC = require('./load-fusionrc.js');
const rimraf = require('rimraf');
const {getEnv} = require('fusion-core');

const {assetPath} = getEnv();

function getConfig({target, env, dir, watch, state}) {
  const main = 'src/main.js';

  if (target !== 'node' && target !== 'web') {
    throw new Error('Invalid target: must be `node` or `web`');
  }
  if (env !== 'production' && env !== 'development') {
    throw new Error('Invalid name: must be `production` or `dev`');
  }
  if (!fs.existsSync(path.resolve(dir, main))) {
    throw new Error(`Project directory must contain a ${main} file`);
  }

  const fusionConfig = loadFusionRC(dir);

  const configPath = path.join(dir, 'package.json');
  // $FlowFixMe
  const configData = fs.existsSync(configPath) ? require(configPath) : {};
  const {pragma, clientHotLoaderEntry, node, alias} = configData;

  const name = {node: 'server', web: 'client'}[target];
  const appBase = path.resolve(dir);
  const appSrcDir = path.resolve(dir, 'src');
  const side = target === 'node' ? 'server' : 'client';
  const destination = path.resolve(dir, `.fusion/dist/${env}/${side}`);
  const serverPublicPathEntry = path.join(
    __dirname,
    `../entries/server-public-path.js`
  );
  const clientPublicPathEntry = path.join(
    __dirname,
    `../entries/client-public-path.js`
  );
  const serverEntry = path.join(__dirname, `../entries/server-entry.js`);
  const clientEntry = path.join(__dirname, `../entries/client-entry.js`);
  const entry = {
    node: serverEntry,
    web: clientEntry,
  }[target];

  const babelConfig = fusionConfig.experimentalCompile
    ? getBabelConfig({
        dev: env === 'development',
        jsx: {pragma},
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        runtime: target === 'node' ? 'node-bundled' : 'browser-legacy',
        specOnly: false,
        plugins:
          fusionConfig.babel && fusionConfig.babel.plugins
            ? fusionConfig.babel.plugins
            : [],
        presets:
          fusionConfig.babel && fusionConfig.babel.presets
            ? fusionConfig.babel.presets
            : [],
      })
    : getBabelConfig({
        runtime: target === 'node' ? 'node-bundled' : 'browser-legacy',
        specOnly: true,
        plugins:
          fusionConfig.babel && fusionConfig.babel.plugins
            ? fusionConfig.babel.plugins
            : [],
        presets:
          fusionConfig.babel && fusionConfig.babel.presets
            ? fusionConfig.babel.presets
            : [],
      });

  const babelOverrides = fusionConfig.experimentalCompile
    ? {}
    : getBabelConfig({
        dev: env === 'development',
        jsx: {pragma},
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        runtime: target === 'node' ? 'node-bundled' : 'browser-legacy',
        specOnly: false,
      });

  const whitelist = ['fusion-cli/entries'];

  // NODE_ENV should be built as 'production' for everything except 'development'
  // and 'production' entries should both map to NODE_ENV='production'
  const nodeEnv = env === 'development' ? 'development' : 'production';

  // Allow overrides with a warning for `dev` command. In production builds, throw if NODE_ENV is not `production`.
  const nodeEnvBanner =
    `if(process.env.NODE_ENV && process.env.NODE_ENV !== '${nodeEnv}') {` +
    `if ('${env}' === 'production') {` +
    `throw new Error(\`NODE_ENV (\${process.env.NODE_ENV}) does not match value for compiled assets: ${nodeEnv}\`);` +
    `} else {` +
    `console.warn('Overriding NODE_ENV: ' + process.env.NODE_ENV + ' to ${nodeEnv} in order to match value for compiled assets');` +
    `process.env.NODE_ENV = '${nodeEnv}';` +
    `}` +
    `} else {` +
    `process.env.NODE_ENV = '${nodeEnv}';` +
    `}`;

  return {
    name,
    target,
    entry: {
      main: [
        target === 'web' && clientPublicPathEntry,
        target === 'node' && serverPublicPathEntry,
        env === 'development' &&
          target === 'web' &&
          watch &&
          clientHotLoaderEntry &&
          resolveFrom(appBase, clientHotLoaderEntry),
        env === 'development' &&
          watch &&
          target !== 'node' &&
          `${require.resolve('webpack-hot-middleware/client')}?name=${name}`,
        // TODO(#46): use 'webpack/hot/signal' instead
        env === 'development' &&
          watch &&
          target === 'node' &&
          `${require.resolve('webpack/hot/poll')}?1000`,
        entry,
      ].filter(Boolean),
    },
    mode: env === 'production' ? 'production' : 'development',
    // TODO(#47): Do we need to do something different here for production?
    stats: 'minimal',
    /**
     * `cheap-module-source-map` is best supported by Chrome DevTools
     * See: https://github.com/webpack/webpack/issues/2145#issuecomment-294361203
     *
     * We use `hidden-source-map` in production to produce a source map but
     * omit the source map comment in the source file.
     *
     * Chrome DevTools support doesn't matter in these case.
     * We only use it for generating nice stack traces
     */
    // TODO(#6): what about node v8 inspector?
    devtool:
      target !== 'node' && env === 'production'
        ? 'hidden-source-map'
        : 'cheap-module-source-map',
    output: {
      // For in-memory filesystem in webpack dev middleware, write files to root
      // Otherwise, write to appropriate location on disk
      path:
        env === 'development' && watch && target === 'web' ? '/' : destination,
      filename:
        env === 'production' && target === 'web'
          ? `${name}-[name]-[chunkhash].js`
          : `${name}-[name].js`,
      libraryTarget: target === 'node' ? 'commonjs2' : 'var',
      // This is the recommended default.
      // See https://webpack.js.org/configuration/output/#output-sourcemapfilename
      sourceMapFilename: `[file].map`,
      // We will set __webpack_public_path__ at runtime, so this should be set to undefined
      publicPath: void 0,
      crossOriginLoading: 'anonymous',
      devtoolModuleFilenameTemplate: info => {
        // always return absolute paths in order to get sensible source map explorer visualization
        return path.isAbsolute(info.absoluteResourcePath)
          ? info.absoluteResourcePath
          : path.resolve(appBase, info.absoluteResourcePath);
      },
    },
    performance: {
      hints: false,
    },
    context: dir,
    node: Object.assign(getNodeConfig(target, env), node),
    module: {
      /**
       * Compile-time error for importing a non-existent export
       * https://github.com/facebookincubator/create-react-app/issues/1559
       */
      strictExportPresence: true,
      rules: [
        /**
         * Global transforms (including ES2017+ transpilations)
         */
        {
          test: /\.jsx?$/,
          exclude: [
            // Blacklist mapbox-gl package because of issues with babel-loader and its AMD bundle
            /node_modules\/mapbox-gl/,
            // Blacklist known ES5 packages for build performance
            /node_modules\/react-dom/,
            /node_modules\/react/,
            /node_modules\/core-js/,
          ],
          use: [
            {
              loader: babelLoader.path,
              options: {
                ...babelConfig,
                /**
                 * Fusion-specific transforms (not applied to node_modules)
                 */
                overrides: [
                  {
                    include: [
                      // Whitelist the app directory rather than maintain a blacklist
                      appSrcDir,
                      // Allow babelifying our client entry. We want to use JSX here.
                      entry,
                      /fusion-cli\/entries/,
                    ],
                    ...babelOverrides,
                  },
                ],
              },
            },
          ],
        },
        {
          test: /\.json$/,
          type: 'javascript/auto',
          loader: require.resolve('./loaders/json-loader.js'),
        },
        fusionConfig.assumeNoImportSideEffects && {
          sideEffects: false,
          test: () => true,
        },
      ].filter(Boolean),
    },
    externals: [
      target === 'node' &&
        ((context, request, callback) => {
          // bundle whitelisted packages
          if (new RegExp(`^(${whitelist.join('|')})`).test(request)) {
            return callback();
          } else if (/^[@a-z\-0-9]+/.test(request)) {
            // do not bundle external packages and those not whitelisted
            const absolutePath = resolveFrom.silent(context, request);
            if (absolutePath === null) {
              // if module is missing, skip rewriting to absolute path
              return callback(null, request);
            }
            return callback(null, 'commonjs ' + absolutePath);
          }
          // bundle everything else (local files, __*)
          return callback();
        }),
    ].filter(Boolean),
    resolve: {
      aliasFields: [target === 'web' && 'browser'].filter(Boolean),
      alias: Object.assign(
        {
          // we replace need to set the path to user application at build-time
          __FRAMEWORK_SHARED_ENTRY__: path.resolve(dir, main),
          __ENV__: env,
        },
        alias
      ),
    },
    resolveLoader: {
      alias: {
        [fileLoader.alias]: fileLoader.path,
        [chunkIdsLoader.alias]: chunkIdsLoader.path,
        [syncChunkIdsLoader.alias]: syncChunkIdsLoader.path,
        [syncChunkPathsLoader.alias]: syncChunkPathsLoader.path,
        [chunkUrlMapLoader.alias]: chunkUrlMapLoader.path,
        [i18nManifestLoader.alias]: i18nManifestLoader.path,
      },
    },
    plugins: [
      target === 'node' &&
        new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
      new ProgressBarPlugin(),
      new LoaderContextProviderPlugin(devContextKey, env !== 'production'),
      target === 'web'
        ? new ClientChunkMetadataStateHydratorPlugin(state.clientChunkMetadata)
        : new LoaderContextProviderPlugin(
            clientChunkMetadataContextKey,
            state.clientChunkMetadata
          ),
      target === 'web'
        ? new I18nDiscoveryPlugin(state.i18nManifest)
        : new LoaderContextProviderPlugin(
            translationsManifestContextKey,
            state.i18nManifest
          ),
      env === 'production' && zopfliWebpackPlugin, // gzip
      // generate compressed files
      env === 'production' && brotliWebpackPlugin, // brotli
      // target === 'web' && env === 'production' && pngquantWebpackPlugin, // png TODO(#10): production server requires libpng-dev installed to use this
      // target === 'web' && env === 'production' && guetzliWebpackPlugin, // jpg TODO(#10): guetzli also depends on libpng-dev for some reason
      env === 'production' && svgoWebpackPlugin, // svg
      // In development, skip the emitting phase on errors to ensure there are
      // no assets emitted that include errors. This fixes an issue with hot reloading
      // server side code and recovering from errors correctly. We only want to do this
      // in dev because the CLI will not exit with an error code if the option is enabled,
      // so failed builds would look like successful ones.
      watch && new webpack.NoEmitOnErrorsPlugin(),
      new InstrumentedImportDependencyTemplatePlugin(
        target !== 'web'
          ? // Client
            state.clientChunkMetadata
          : /**
             * Server
             * Don't wait for the client manifest on the client.
             * The underlying plugin handles client instrumentation on its own.
             */
            void 0
      ),
      env === 'development' &&
        watch &&
        new webpack.HotModuleReplacementPlugin(),
      env === 'production' &&
        target === 'web' &&
        new webpack.HashedModuleIdsPlugin(),
      target === 'web' &&
        // case-insensitive paths can cause problems
        new CaseSensitivePathsPlugin(),
      target === 'node' &&
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: false,
          // source-map-support is a dep of framework, so we need to resolve this path
          banner: `require('${require.resolve(
            'source-map-support'
          )}').install();`,
        }),
      target === 'node' &&
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: true,
          // Enforce NODE_ENV at runtime
          banner: nodeEnvBanner,
        }),
      new webpack.EnvironmentPlugin({NODE_ENV: nodeEnv}),
    ].filter(Boolean),
    optimization: {
      minimizer:
        env === 'production' && target === 'web'
          ? [
              new UglifyJsPlugin({
                sourceMap: true, // default from webpack (see https://github.com/webpack/webpack/blob/aab3554cad2ebc5d5e9645e74fb61842e266da34/lib/WebpackOptionsDefaulter.js#L290-L297)
                cache: true, // default from webpack
                parallel: true, // default from webpack
                uglifyOptions: {
                  compress: {
                    // typeofs: true (default) transforms typeof foo == "undefined" into foo === void 0.
                    // This mangles mapbox-gl creating an error when used alongside with window global mangling:
                    // https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/189
                    typeofs: false,

                    // inline=2 can cause const reassignment
                    // https://github.com/mishoo/UglifyJS2/issues/2842
                    inline: 1,
                  },
                },
              }),
            ]
          : undefined,
      sideEffects: true,
      runtimeChunk: target === 'web' && {
        name: 'runtime',
      },
      splitChunks: target === 'web' && {
        // See https://webpack.js.org/guides/code-splitting/
        // See https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693
        // See https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
        // Bundles all node_modules code into vendor chunk
        chunks: 'async',
        minSize: 30000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        name: true,
        cacheGroups: {
          default: {
            minChunks: 2,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'initial',
            enforce: true,
          },
        },
      },
    },
  };
}

function getStatsLogger({dir, logger, envs}) {
  return (err, stats) => {
    // syntax errors are logged 4 times (once by webpack, once by babel, once on server and once on client)
    // we only want to log each syntax error once
    function dedupeErrors(items) {
      const re = /BabelLoaderError(.|\n)+( {4}at transpile)/gim;
      return items.map(item => item.replace(re, '$2'));
    }

    const isProd = envs.includes('production');

    if (err) {
      logger.error(err.stack || err);
      if (err.details) {
        logger.error(err.details);
      }
      return;
    }

    const file = path.resolve(dir, '.fusion/stats.json');
    const info = stats.toJson({context: path.resolve(dir)});
    fs.writeFile(file, JSON.stringify(info, null, 2), () => {});

    if (stats.hasErrors()) {
      dedupeErrors(info.errors).forEach(e => logger.error(e));
    }
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
      dedupeErrors(info.warnings).forEach(e => logger.warn(e));
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

function Compiler(
  {dir = '.', envs = [], watch = false, logger = console} /*: any */
) /*: CompilerType */ {
  const state = {
    clientChunkMetadata: new DeferredState(),
    i18nManifest: new DeferredState(),
  };

  const root = path.resolve(dir);

  const profiles = envs.map(env => {
    return [
      getConfig({target: 'web', env, dir: root, watch, state}),
      getConfig({target: 'node', env, dir: root, watch, state}),
    ];
  });
  const flattened = [].concat(...profiles);
  const compiler = webpack(flattened);

  const statsLogger = getStatsLogger({dir, logger, envs});

  this.on = (type, callback) => compiler.hooks[type].tap('compiler', callback);
  this.start = cb => {
    cb = cb || function noop() {};
    // Handler may be called multiple times by `watch`
    // But only call `cb` the first tiem
    // subsequent rebuilds are subscribed to with 'compiler.on('done')'
    let hasCalledCb = false;
    const handler = (err, stats) => {
      statsLogger(err, stats);
      if (!hasCalledCb) {
        hasCalledCb = true;
        cb(err, stats);
      }
    };
    if (watch) {
      return compiler.watch({}, handler);
    } else {
      compiler.run(handler);
      // mimic watcher interface for API consistency
      return {
        close() {},
        invalidate() {},
      };
    }
  };

  this.getMiddleware = () => {
    const dev = webpackDevMiddleware(compiler, {
      filter: c => c.name === 'client',
      noInfo: true,
      quiet: true,
      lazy: false,
      stats: {
        colors: true,
      },
      reporter: null,
      serverSideRender: true,
      publicPath: assetPath,
    });
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
      rimraf(`${dir}/.fusion`, e => (e ? reject(e) : resolve()));
    });
  };

  return this;
}

function getNodeConfig(target, env) {
  const emptyForWeb = target === 'web' ? 'empty' : false;
  return {
    // Polyfilling process involves lots of cruft. Better to explicitly inline env value statically
    process: false,
    // We definitely don't want automatic Buffer polyfills. This should be explicit and in userland code
    Buffer: false,
    // We definitely don't want automatic setImmediate polyfills. This should be explicit and in userland code
    setImmediate: false,
    // We want these to resolve to the original file source location, not the compiled location
    // in the future, we may want to consider using `import.meta`
    __filename: true,
    __dirname: true,
    // This is required until we have better tree shaking. See https://github.com/fusionjs/fusion-cli/issues/254
    child_process: emptyForWeb,
    cluster: emptyForWeb,
    crypto: emptyForWeb,
    dgram: emptyForWeb,
    dns: emptyForWeb,
    fs: emptyForWeb,
    module: emptyForWeb,
    net: emptyForWeb,
    readline: emptyForWeb,
    repl: emptyForWeb,
    tls: emptyForWeb,
  };
}

module.exports.Compiler = Compiler;
