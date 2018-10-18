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
const TerserPlugin = require('terser-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ChunkIdPrefixPlugin = require('./plugins/chunk-id-prefix-plugin.js');
const {
  zopfliWebpackPlugin,
  brotliWebpackPlugin,
  svgoWebpackPlugin,
} = require('../lib/compression');
const resolveFrom = require('resolve-from');
const getBabelConfig = require('./get-babel-config.js');
const LoaderContextProviderPlugin = require('./plugins/loader-context-provider-plugin.js');
const ChildCompilationPlugin = require('./plugins/child-compilation-plugin.js');
const {
  chunkIdsLoader,
  gqlLoader,
  fileLoader,
  babelLoader,
  i18nManifestLoader,
  chunkUrlMapLoader,
  syncChunkIdsLoader,
  syncChunkPathsLoader,
} = require('./loaders/index.js');
const {
  translationsManifestContextKey,
  clientChunkMetadataContextKey,
  devContextKey,
} = require('./loaders/loader-context.js');
const ClientChunkMetadataStateHydratorPlugin = require('./plugins/client-chunk-metadata-state-hydrator-plugin.js');
const InstrumentedImportDependencyTemplatePlugin = require('./plugins/instrumented-import-dependency-template-plugin');
const I18nDiscoveryPlugin = require('./plugins/i18n-discovery-plugin.js');

/*::
type Runtime = "server" | "client";
*/

const COMPILATIONS /*: {[string]: Runtime} */ = {
  server: 'server',
  'client-legacy': 'client',
};

/*::
import type {
  ClientChunkMetadataState,
  TranslationsManifestState,
  LegacyBuildEnabledState,
} from "./types.js";

import type {
  FusionRC
} from "./load-fusionrc.js";

type WebpackConfigOpts = {|
  id: $Keys<typeof COMPILATIONS>,
  dir: string,
  dev: boolean,
  watch: boolean,
  state: {
    clientChunkMetadata: ClientChunkMetadataState,
    legacyClientChunkMetadata: ClientChunkMetadataState,
    mergedClientChunkMetadata: ClientChunkMetadataState,
    i18nManifest: TranslationsManifestState,
    legacyBuildEnabled: LegacyBuildEnabledState,
  },
  fusionConfig: FusionRC,
  legacyPkgConfig?: {
    node?: Object
  }
|};
*/

module.exports = getWebpackConfig;

function getWebpackConfig(opts /*: WebpackConfigOpts */) {
  const {id, dev, dir, watch, state, fusionConfig, legacyPkgConfig = {}} = opts;
  const main = 'src/main.js';

  if (!fs.existsSync(path.join(dir, main))) {
    throw new Error(`Project directory must contain a ${main} file`);
  }

  const runtime = COMPILATIONS[id];
  const env = dev ? 'development' : 'production';

  const babelConfig = fusionConfig.experimentalCompile
    ? getBabelConfig({
        dev: dev,
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        target: runtime === 'server' ? 'node-bundled' : 'browser-modern',
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
        target: runtime === 'server' ? 'node-bundled' : 'browser-modern',
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
        dev: dev,
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        target: runtime === 'server' ? 'node-bundled' : 'browser-modern',
        specOnly: false,
      });

  const legacyBabelConfig = fusionConfig.experimentalCompile
    ? getBabelConfig({
        dev: dev,
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        target: runtime === 'server' ? 'node-bundled' : 'browser-legacy',
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
        target: runtime === 'server' ? 'node-bundled' : 'browser-legacy',
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

  const legacyBabelOverrides = fusionConfig.experimentalCompile
    ? {}
    : getBabelConfig({
        dev: dev,
        fusionTransforms: true,
        assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
        target: runtime === 'server' ? 'node-bundled' : 'browser-legacy',
        specOnly: false,
      });

  return {
    name: runtime,
    target: {server: 'node', client: 'web'}[runtime],
    entry: {
      main: [
        runtime === 'client' &&
          path.join(__dirname, '../entries/client-public-path.js'),
        runtime === 'server' &&
          path.join(__dirname, '../entries/server-public-path.js'),
        dev &&
          watch &&
          runtime !== 'server' &&
          `${require.resolve('webpack-hot-middleware/client')}?name=client`,
        // TODO(#46): use 'webpack/hot/signal' instead
        dev &&
          watch &&
          runtime === 'server' &&
          `${require.resolve('webpack/hot/poll')}?1000`,
        runtime === 'server' &&
          path.join(__dirname, '../entries/server-entry.js'),
        runtime === 'client' &&
          path.join(__dirname, '../entries/client-entry.js'),
      ].filter(Boolean),
    },
    mode: dev ? 'development' : 'production',
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
      runtime === 'client' && !dev
        ? 'hidden-source-map'
        : 'cheap-module-source-map',
    output: {
      // For in-memory filesystem in webpack dev middleware, write files to root
      // Otherwise, write to appropriate location on disk
      path:
        dev && watch && id !== 'server'
          ? '/'
          : path.join(dir, `.fusion/dist/${env}/${runtime}`),
      filename:
        runtime === 'server'
          ? 'server-main.js'
          : dev
            ? 'client-[name].js'
            : 'client-[name]-[chunkhash].js',
      libraryTarget: runtime === 'server' ? 'commonjs2' : 'var',
      // This is the recommended default.
      // See https://webpack.js.org/configuration/output/#output-sourcemapfilename
      sourceMapFilename: `[file].map`,
      // We will set __webpack_public_path__ at runtime, so this should be set to undefined
      publicPath: void 0,
      crossOriginLoading: 'anonymous',
      devtoolModuleFilenameTemplate: (info /*: Object */) => {
        // always return absolute paths in order to get sensible source map explorer visualization
        return path.isAbsolute(info.absoluteResourcePath)
          ? info.absoluteResourcePath
          : path.join(dir, info.absoluteResourcePath);
      },
    },
    performance: {
      hints: false,
    },
    context: dir,
    node: Object.assign(
      getNodeConfig(runtime),
      legacyPkgConfig.node,
      fusionConfig.nodeBuiltins
    ),
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
        runtime === 'server' && {
          compiler: 'server',
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
                      // Explictly only transpile user source code as well as fusion-cli entry files
                      path.join(dir, 'src'),
                      /fusion-cli\/entries/,
                    ],
                    ...babelOverrides,
                  },
                ],
              },
            },
          ],
        },
        /**
         * Global transforms (including ES2017+ transpilations)
         */
        runtime === 'client' && {
          compiler: 'client',
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
                      // Explictly only transpile user source code as well as fusion-cli entry files
                      path.join(dir, 'src'),
                      /fusion-cli\/entries/,
                    ],
                    ...babelOverrides,
                  },
                ],
              },
            },
          ],
        },
        /**
         * Global transforms (including ES2017+ transpilations)
         */
        runtime === 'client' && {
          compiler: 'legacy-client-legacy',
          test: /\.jsx?$/,
          exclude: [
            // Blacklist mapbox-gl package because of issues with babel-loader and its AMD bundle
            /node_modules\/mapbox-gl\//,
            // Blacklist known ES5 packages for build performance
            /node_modules\/react-dom\//,
            /node_modules\/react\//,
            /node_modules\/core-js\//,
          ],
          use: [
            {
              loader: babelLoader.path,
              options: {
                ...legacyBabelConfig,
                /**
                 * Fusion-specific transforms (not applied to node_modules)
                 */
                overrides: [
                  {
                    include: [
                      // Explictly only transpile user source code as well as fusion-cli entry files
                      path.join(dir, 'src'),
                      /fusion-cli\/entries/,
                    ],
                    ...legacyBabelOverrides,
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
          test: modulePath => {
            if (
              modulePath.includes('core-js/modules') ||
              modulePath.includes('regenerator-runtime/runtime')
            ) {
              return false;
            }

            return true;
          },
        },
      ].filter(Boolean),
    },
    externals: [
      runtime === 'server' &&
        ((context, request, callback) => {
          if (/^[@a-z\-0-9]+/.test(request)) {
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
        runtime === 'client' && 'browser',
        'es2015',
        'es2017',
      ].filter(Boolean),
      alias: {
        // we replace need to set the path to user application at build-time
        __FUSION_ENTRY_PATH__: path.join(dir, main),
        __ENV__: env,
      },
    },
    resolveLoader: {
      alias: {
        [gqlLoader.alias]: gqlLoader.path,
        [fileLoader.alias]: fileLoader.path,
        [chunkIdsLoader.alias]: chunkIdsLoader.path,
        [syncChunkIdsLoader.alias]: syncChunkIdsLoader.path,
        [syncChunkPathsLoader.alias]: syncChunkPathsLoader.path,
        [chunkUrlMapLoader.alias]: chunkUrlMapLoader.path,
        [i18nManifestLoader.alias]: i18nManifestLoader.path,
      },
    },
    plugins: [
      runtime === 'client' &&
        new webpack.optimize.RuntimeChunkPlugin({
          name: 'runtime',
        }),
      new webpack.optimize.SideEffectsFlagPlugin(),
      runtime === 'server' &&
        new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
      new ProgressBarPlugin(),
      new LoaderContextProviderPlugin(devContextKey, dev),
      runtime === 'server' &&
        new LoaderContextProviderPlugin(
          clientChunkMetadataContextKey,
          state.mergedClientChunkMetadata
        ),
      runtime === 'client'
        ? new I18nDiscoveryPlugin(state.i18nManifest)
        : new LoaderContextProviderPlugin(
            translationsManifestContextKey,
            state.i18nManifest
          ),
      !dev && zopfliWebpackPlugin,
      !dev && brotliWebpackPlugin,
      !dev && svgoWebpackPlugin,
      // In development, skip the emitting phase on errors to ensure there are
      // no assets emitted that include errors. This fixes an issue with hot reloading
      // server side code and recovering from errors correctly. We only want to do this
      // in dev because the CLI will not exit with an error code if the option is enabled,
      // so failed builds would look like successful ones.
      watch && new webpack.NoEmitOnErrorsPlugin(),
      new InstrumentedImportDependencyTemplatePlugin(
        runtime !== 'client'
          ? // Server
            state.clientChunkMetadata
          : /**
             * Client
             * Don't wait for the client manifest on the client.
             * The underlying plugin handles client instrumentation on its own.
             */
            void 0
      ),
      dev && watch && new webpack.HotModuleReplacementPlugin(),
      !dev && runtime === 'client' && new webpack.HashedModuleIdsPlugin(),
      runtime === 'client' &&
        // case-insensitive paths can cause problems
        new CaseSensitivePathsPlugin(),
      runtime === 'server' &&
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: false,
          // source-map-support is a dep of framework, so we need to resolve this path
          banner: `require('${require.resolve(
            'source-map-support'
          )}').install();`,
        }),
      runtime === 'server' &&
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: true,
          // Enforce NODE_ENV at runtime
          banner: getEnvBanner(env),
        }),
      new webpack.EnvironmentPlugin({NODE_ENV: env}),
      id === 'client-legacy' &&
        new ClientChunkMetadataStateHydratorPlugin(state.clientChunkMetadata),
      id === 'client-legacy' &&
        new ChildCompilationPlugin({
          entry: [
            path.resolve(__dirname, '../entries/client-public-path.js'),
            path.resolve(__dirname, '../entries/client-entry.js'),
            // EVENTUALLY HAVE HMR
          ],
          enabledState: opts.state.legacyBuildEnabled,
          outputOptions: {
            filename: opts.dev
              ? 'client-legacy-[name].js'
              : 'client-legacy-[name]-[chunkhash].js',
            chunkFilename: opts.dev
              ? 'client-legacy-[name].js'
              : 'client-legacy-[name]-[chunkhash].js',
          },
          plugins: options => [
            new webpack.optimize.RuntimeChunkPlugin(
              options.optimization.runtimeChunk
            ),
            new webpack.optimize.SplitChunksPlugin(
              options.optimization.splitChunks
            ),
            // need to re-apply template
            new InstrumentedImportDependencyTemplatePlugin(void 0),
            new ClientChunkMetadataStateHydratorPlugin(
              state.legacyClientChunkMetadata
            ),
            new ChunkIdPrefixPlugin(),
          ],
        }),
    ].filter(Boolean),
    optimization: {
      runtimeChunk: runtime === 'client' && {name: 'runtime'},
      splitChunks: runtime === 'client' && {
        chunks: 'async',
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
      minimizer:
        !dev && runtime === 'client'
          ? [
              new TerserPlugin({
                sourceMap: true, // default from webpack (see https://github.com/webpack/webpack/blob/aab3554cad2ebc5d5e9645e74fb61842e266da34/lib/WebpackOptionsDefaulter.js#L290-L297)
                cache: true, // default from webpack
                parallel: true, // default from webpack
                terserOptions: {
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
    },
  };
}

// Allow overrides with a warning for `dev` command. In production builds, throw if NODE_ENV is not `production`.
function getEnvBanner(env) {
  return `
if (process.env.NODE_ENV && process.env.NODE_ENV !== '${env}') {
  if (${env === 'production' ? 'true' : 'false'}) {
    throw new Error(\`NODE_ENV (\${process.env.NODE_ENV}) does not match value for compiled assets: ${env}\`);
  } else {
    console.warn('Overriding NODE_ENV: ' + process.env.NODE_ENV + ' to ${env} in order to match value for compiled assets');
    process.env.NODE_ENV = '${env}';
  }
} else {
  process.env.NODE_ENV = '${env}';
}
  `;
}

function getNodeConfig(runtime) {
  const emptyForWeb = runtime === 'client' ? 'empty' : false;
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
