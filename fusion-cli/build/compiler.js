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
  brotliWebpackPlugin,
  //pngquantWebpackPlugin,
  //guetzliWebpackPlugin,
  svgoWebpackPlugin,
} = require('../lib/compression');
const resolveFrom = require('resolve-from');

const AssetsManifestPlugin = require('@nadiia/file-loader')
  .assetsManifestPlugin;
const ClientSourceMapPlugin = require('./client-source-map-plugin');
const ChunkPreloadPlugin = require('./chunk-preload-plugin');
const ChunkModuleManifestPlugin = require('./chunk-module-manifest-plugin');
const chunkModuleManifest = require('./chunk-module-manifest');
const InstrumentedImportDependencyTemplatePlugin = require('./instrumented-import-dependency-template-plugin');
const I18nDiscoveryPlugin = require('./i18n-discovery-plugin.js');
const ClientChunkBundleUrlMapPlugin = require('./client-chunk-bundle-url-map-plugin');
const SyncChunkIdsPlugin = require('./sync-chunk-ids-plugin');
const browserSupport = require('./browser-support');
const ServiceWorkerTimestampPlugin = require('./service-worker-timestamp-plugin.js');
const chalk = require('chalk');
const webpackHotMiddleware = require('webpack-hot-middleware');
const globby = require('globby');
const loadFusionRC = require('./load-fusionrc.js');
const rimraf = require('rimraf');
const {getEnv} = require('fusion-core');

const {assetPath} = getEnv();

function getConfig({target, env, dir, watch, cover}) {
  const main = 'src/main.js';

  if (target !== 'node' && target !== 'web' && target !== 'webworker') {
    throw new Error('Invalid target: must be `node`, `web`, or `webworker`');
  }
  if (env !== 'production' && env !== 'development' && env !== 'test') {
    throw new Error('Invalid name: must be `production`, `dev`, or `test`');
  }
  if (!fs.existsSync(path.resolve(dir, main))) {
    throw new Error(`Project directory must contain a ${main} file`);
  }

  const serverOnlyTestGlob = `${dir}/src/**/__tests__/*.node.js`;
  const browserOnlyTestGlob = `${dir}/src/**/__tests__/*.browser.js`;
  const universalTestGlob = `${dir}/src/**/__tests__/*.js`;

  const serverTestEntry = `__SECRET_MULTI_ENTRY_LOADER__?include[]=${universalTestGlob},include[]=${dir}/${main},exclude[]=${browserOnlyTestGlob}!`;
  const browserTestEntry = `__SECRET_MULTI_ENTRY_LOADER__?include[]=${universalTestGlob},include[]=${dir}/${main},exclude[]=${serverOnlyTestGlob}!`;

  if (
    env === 'test' &&
    !globby.sync([universalTestGlob, `!${browserOnlyTestGlob}`]).length
  ) {
    throw new Error(
      `Testing requires server tests in __tests__ with *.js or *.node.js extension`
    );
  }
  if (
    env === 'test' &&
    !globby.sync([universalTestGlob, `!${serverOnlyTestGlob}`]).length
  ) {
    throw new Error(
      `Testing requires browser tests in __tests__ with *.js or *.browser.js extension`
    );
  }

  const fusionConfig = loadFusionRC(dir);

  const configPath = path.join(dir, 'package.json');
  // $FlowFixMe
  const configData = fs.existsSync(configPath) ? require(configPath) : {};
  const {pragma, clientHotLoaderEntry, node, alias} = configData;

  const name = {node: 'server', web: 'client', webworker: 'sw'}[target];
  const appBase = path.resolve(dir);
  const appSrcDir = path.resolve(dir, 'src');
  const side = target === 'node' ? 'server' : 'client';
  const destination = path.resolve(dir, `.fusion/dist/${env}/${side}`);
  const evergreen = false;
  const possibleESVersions = ['es5'];
  const serverEntry =
    env === 'test'
      ? serverTestEntry
      : path.join(__dirname, `../entries/server-entry.js`);
  const clientEntry =
    env === 'test'
      ? browserTestEntry
      : path.join(__dirname, `../entries/client-entry.js`);
  const entry = {
    node: serverEntry,
    web: clientEntry,
    webworker: path.join(dir, 'src/sw.js'),
  }[target];

  const whitelist = ['fusion-cli/entries'];

  if (target === 'webworker' && !fs.existsSync(entry)) return null;

  // NODE_ENV should be built as 'production' for everything except 'development'
  // 'test' and 'production' entries should both map to NODE_ENV='production'
  const nodeEnv = env === 'development' ? 'development' : 'production';

  // Allow overrides with a warning for `dev` and `test` commands. In production builds, throw if NODE_ENV is not `production`.
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

  const targets =
    target === 'node'
      ? {
          node: 'current',
        }
      : {
          browsers: evergreen
            ? browserSupport.evergreen
            : browserSupport.conservative,
        };

  return {
    name,
    target,
    entry: {
      main: [
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
      chunkFilename:
        env === 'production' && target === 'web'
          ? '[id]-[chunkhash].js'
          : evergreen
            ? 'evergreen-[id].js'
            : '[id].js',
      // We will set __webpack_public_path__ at runtime, so this should be set to undefined
      publicPath: void 0,
      // TODO(#7): Do we really need this? See lite config
      crossOriginLoading: 'anonymous',
      devtoolModuleFilenameTemplate: info => {
        // always return absolute paths in order to get sensible source map explorer visualization
        return path.isAbsolute(info.absoluteResourcePath)
          ? info.absoluteResourcePath
          : path.resolve(appBase, info.absoluteResourcePath);
      },
    },
    devServer: {
      contentBase: '.',
      hot: true,
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
            // Blacklist react packages for performance
            /node_modules\/react-dom/,
            /node_modules\/react/,
          ],
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: `${dir}/node_modules/.fusion_babel_cache`,
                plugins: [
                  // Note: plugins run first to last, so user-defined plugins go first
                  ...(fusionConfig.babel && fusionConfig.babel.plugins
                    ? fusionConfig.babel.plugins
                    : []),
                ],
                presets: [
                  // Note: presets run last to first, so user-defined presets go last
                  [
                    require.resolve('./babel-transpilation-preset.js'),
                    {
                      targets,
                    },
                  ],
                  ...(fusionConfig.babel && fusionConfig.babel.presets
                    ? fusionConfig.babel.presets
                    : []),
                ],

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
                    plugins: [
                      //cup-globals works with webpack.EnvironmentPlugin(['NODE_ENV']) to implement static conditionals
                      require.resolve('./babel-plugins/babel-plugin-asseturl'),
                      require.resolve(
                        './babel-plugins/babel-plugin-pure-create-plugin'
                      ),
                      require.resolve(
                        './babel-plugins/babel-plugin-sync-chunk-ids'
                      ),
                      require.resolve(
                        './babel-plugins/babel-plugin-sync-chunk-paths'
                      ),
                      require.resolve('./babel-plugins/babel-plugin-chunkid'),
                      // TODO(#8): sw implementation is totally busted.
                      // require.resolve('./babel-plugins/babel-plugin-sw'),
                      pragma && [
                        require.resolve('@babel/plugin-transform-react-jsx'),
                        {pragma},
                      ],
                      cover && require.resolve('babel-plugin-istanbul'),
                      target === 'web' &&
                        require.resolve('./babel-plugins/babel-plugin-i18n'),
                    ].filter(Boolean),
                    presets: [
                      [
                        require.resolve('./babel-fusion-preset.js'),
                        {
                          targets,
                          assumeNoImportSideEffects:
                            fusionConfig.assumeNoImportSideEffects,
                        },
                      ],
                    ],
                  },
                ],

                babelrc: false,
              },
            },
          ],
        },
        // As of webpack 4 we need to set a type of 'javascript/auto' for JSON files,
        // otherwise webpack will automatically parse JSON, breaking our file-loader logic.
        {
          type: 'javascript/auto',
          test: /\.(json)/,
          loader: 'json-loader',
        },
        fusionConfig.assumeNoImportSideEffects && {
          sideEffects: false,
          test: () => true,
        },
      ].filter(Boolean),
    },
    externals: [
      // These externals are required to work with enzyme
      // See: https://github.com/airbnb/enzyme/blob/master/docs/guides/webpack.md
      env === 'test' && 'react/addons',
      env === 'test' && 'react/lib/ReactContext',
      env === 'test' && 'react/lib/ExecutionEnvironment',
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
      aliasFields: [
        (target === 'web' || target === 'webworker') && 'browser',
        evergreen && 'es2015',
      ].filter(Boolean),
      // This is removed because it was causing a dependency issue when using
      // recent versions of superfine. Specifically, if a project uses
      // superfine-react and react-footer, two versions of superbase would be
      // included. Version 6.x and 11.x. react-footer expects the 6.x and when
      // rendered on the server would use the proper version, but in the browser
      // it would require 11.x which breaks react-footer (and other dependencies
      // that rely on react-superbase). Commenting out this section resolves
      // this problem.
      // modules: [
      //   for the client, we need to tell webpack to resolve host node_modules so we can bundle them
      //   target !== 'node' && appModules,
      //   'node_modules',
      // ].filter(Boolean),
      // $FlowFixMe
      alias: Object.assign(
        {
          // we replace need to set the path to user application at build-time
          __FRAMEWORK_SHARED_ENTRY__: path.resolve(dir, main),
          __ENV__: env,
        },
        target === 'node' &&
          env === 'test' && {
            __NODE_TEST_ENTRY__: serverTestEntry,
          },
        target === 'web' &&
          env === 'test' && {
            __BROWSER_TEST_ENTRY__: browserTestEntry,
          },
        alias
      ),
    },
    resolveLoader: {
      alias: {
        __SECRET_FILE_LOADER__: require.resolve('@nadiia/file-loader'),
        __SECRET_CHUNK_ID_LOADER__: require.resolve('./chunk-id-loader'),
        __SECRET_SYNC_CHUNK_IDS_LOADER__: require.resolve(
          './sync-chunk-ids-loader'
        ),
        __SECRET_SYNC_CHUNK_PATHS_LOADER__: require.resolve(
          './sync-chunk-paths-loader'
        ),
        __SECRET_BUNDLE_MAP_LOADER__: require.resolve(
          './client-chunk-bundle-url-map-loader'
        ),
        __SECRET_CLIENT_SOURCE_MAP_LOADER__: require.resolve(
          './client-source-map-loader'
        ),
        __SECRET_MULTI_ENTRY_LOADER__: require.resolve('multi-entry-loader'),
        __SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__: require.resolve(
          './i18n-manifest-instrumentation-loader.js'
        ),
      },
    },
    plugins: [
      new ProgressBarPlugin(),
      // TODO(#9): relying only on timestamp will invalidate service worker after every build
      // optimize by importing all chunk names to sw and then remove timestamp in non-dev.
      target === 'webworker' && new ServiceWorkerTimestampPlugin(),
      // generate compressed files
      target === 'web' && env === 'production' && brotliWebpackPlugin, // brotli
      // target === 'web' && env === 'production' && pngquantWebpackPlugin, // png TODO(#10): production server requires libpng-dev installed to use this
      // target === 'web' && env === 'production' && guetzliWebpackPlugin, // jpg TODO(#10): guetzli also depends on libpng-dev for some reason
      target === 'web' && env === 'production' && svgoWebpackPlugin, // svg
      // In development, skip the emitting phase on errors to ensure there are
      // no assets emitted that include errors. This fixes an issue with hot reloading
      // server side code and recovering from errors correctly. We only want to do this
      // in dev because the CLI will not exit with an error code if the option is enabled,
      // so failed builds would look like successful ones.
      watch && new webpack.NoEmitOnErrorsPlugin(),
      new InstrumentedImportDependencyTemplatePlugin(
        target !== 'web'
          ? // Client
            {
              clientChunkModuleManifest: chunkModuleManifest,
            }
          : // Server or SW
            {
              /**
               * Don't wait for the client manifest on the client.
               * The underlying plugin handles client instrumentation on its own.
               */
            }
      ),
      env === 'development' &&
        watch &&
        new webpack.HotModuleReplacementPlugin(),
      env === 'production' &&
        target === 'web' &&
        new webpack.HashedModuleIdsPlugin(),
      target === 'web' && env !== 'test' && new ChunkPreloadPlugin(),
      // TODO(#11): What do we do for client-side error reporting in the service worker?
      // Do we add in reporting code to the sw? Should we map stack traces on the server?
      target === 'web' && new ClientSourceMapPlugin(),
      target === 'web' && new SyncChunkIdsPlugin(),
      target === 'web' &&
        new ClientChunkBundleUrlMapPlugin(
          possibleESVersions || ['es5'],
          evergreen ? 'es6' : 'es5'
        ),
      target === 'web' &&
        new ChunkModuleManifestPlugin({
          appSrcDir,
          clientUserlandEntry: path.resolve(dir, 'src/main.js'),
          onInvalidate: () => {
            // translations are invalid
            chunkModuleManifest.invalidate();
          },
          onChunkIndex: chunkMap => {
            // We now have all translations
            chunkModuleManifest.set(chunkMap);
          },
        }),
      target === 'web' &&
        new I18nDiscoveryPlugin({
          cachePath: path.join(
            dir,
            'node_modules/.fusion_babel_cache/i18n-manifest.json'
          ),
        }),
      // case-insensitive paths can cause problems
      new CaseSensitivePathsPlugin(),
      target === 'web' && new AssetsManifestPlugin(),
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
                    inline: 1, // inline=2 can cause const reassignment (https://github.com/mishoo/UglifyJS2/issues/2842)
                  },
                },
              }),
            ]
          : undefined,
      sideEffects: true,
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
            filename:
              env === 'production' && target === 'web'
                ? `${name}-[name]-[chunkhash].js`
                : `${name}-[name].js`,
            chunks: 'initial',
            enforce: true,
          },
        },
      },
    },
  };
}

function getProfile({dir, env, watch, cover}) {
  return [
    // browser
    getConfig({target: 'web', env, dir, watch, cover}),
    // server
    getConfig({target: 'node', env, dir, watch, cover}),
    // sw
    getConfig({target: 'webworker', env, dir, watch, cover}),
  ].filter(Boolean);
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
  {
    dir = '.',
    envs = [],
    watch = false,
    cover = false,
    logger = console,
  } /*: any */
) /*: CompilerType */ {
  const profiles = envs.map(env => {
    return getProfile({env: env, dir: path.resolve(dir), watch, cover});
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
      filter: c => c.name === 'client' || c.name === 'client-evergreen',
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
  const tapeConfig = env === 'test' && target === 'web' ? 'mock' : false;
  const emptyForWeb = target === 'web' ? 'empty' : false;
  return {
    // Polyfilling process involves lots of cruft. Better to explicitly inline env value statically
    // Tape requires process to be defined
    process: tapeConfig,
    // We definitely don't want automatic Buffer polyfills. This should be explicit and in userland code
    Buffer: tapeConfig,
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
