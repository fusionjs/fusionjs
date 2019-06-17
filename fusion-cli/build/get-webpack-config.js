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
  fileLoader,
  babelLoader,
  i18nManifestLoader,
  chunkUrlMapLoader,
  syncChunkIdsLoader,
  syncChunkPathsLoader,
  swLoader,
  workerLoader,
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
type Runtime = "server" | "client" | "sw";
*/

const COMPILATIONS /*: {[string]: Runtime} */ = {
  server: 'server',
  serverless: 'server',
  'client-modern': 'client',
  sw: 'sw',
};
const EXCLUDE_TRANSPILATION_PATTERNS = [
  /node_modules\/mapbox-gl\//,
  /node_modules\/react-dom\//,
  /node_modules\/react\//,
  /node_modules\/core-js\//,
];
const JS_EXT_PATTERN = /\.(mjs|js|jsx)$/;

/*::
import type {
  ClientChunkMetadataState,
  TranslationsManifest,
  TranslationsManifestState,
  LegacyBuildEnabledState,
} from "./types.js";

import type {
  FusionRC
} from "./load-fusionrc.js";

export type WebpackConfigOpts = {|
  id: $Keys<typeof COMPILATIONS>,
  dir: string,
  dev: boolean,
  hmr: boolean,
  watch: boolean,
  preserveNames: boolean,
  zopfli: boolean,
  minify: boolean,
  state: {
    clientChunkMetadata: ClientChunkMetadataState,
    legacyClientChunkMetadata: ClientChunkMetadataState,
    mergedClientChunkMetadata: ClientChunkMetadataState,
    i18nManifest: TranslationsManifest,
    i18nDeferredManifest: TranslationsManifestState,
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
  const {
    id,
    dev,
    dir,
    hmr,
    watch,
    state,
    fusionConfig,
    zopfli,
    minify,
    legacyPkgConfig = {},
  } = opts;
  const main = 'src/main.js';

  if (!fs.existsSync(path.join(dir, main))) {
    throw new Error(`Project directory must contain a ${main} file`);
  }

  const runtime = COMPILATIONS[id];
  const env = dev ? 'development' : 'production';
  const shouldMinify = !dev && minify;

  const babelConfig = getBabelConfig({
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

  const babelOverrides = getBabelConfig({
    dev: dev,
    fusionTransforms: true,
    assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
    target: runtime === 'server' ? 'node-bundled' : 'browser-modern',
    specOnly: false,
  });

  const legacyBabelConfig = getBabelConfig({
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

  const legacyBabelOverrides = getBabelConfig({
    dev: dev,
    fusionTransforms: true,
    assumeNoImportSideEffects: fusionConfig.assumeNoImportSideEffects,
    target: runtime === 'server' ? 'node-bundled' : 'browser-legacy',
    specOnly: false,
  });

  const getTransformDefault = modulePath => {
    if (
      modulePath.startsWith(getSrcPath(dir)) ||
      /fusion-cli(\/|\\)(entries|plugins)/.test(modulePath)
    ) {
      return 'all';
    }
    return 'spec';
  };

  const {experimentalBundleTest, experimentalTransformTest} = fusionConfig;
  const babelTester = experimentalTransformTest
    ? modulePath => {
        if (!JS_EXT_PATTERN.test(modulePath)) {
          return false;
        }
        const transform = experimentalTransformTest(
          modulePath,
          getTransformDefault(modulePath)
        );
        if (transform === 'none') {
          return false;
        } else if (transform === 'all' || transform === 'spec') {
          return true;
        } else {
          throw new Error(
            `Unexpected value from experimentalTransformTest ${transform}. Expected 'spec' | 'all' | 'none'`
          );
        }
      }
    : JS_EXT_PATTERN;

  // $FlowFixMe
  babelOverrides.test = legacyBabelOverrides.test = modulePath => {
    if (!JS_EXT_PATTERN.test(modulePath)) {
      return false;
    }
    const defaultTransform = getTransformDefault(modulePath);
    const transform = experimentalTransformTest
      ? experimentalTransformTest(modulePath, defaultTransform)
      : defaultTransform;
    if (transform === 'none' || transform === 'spec') {
      return false;
    } else if (transform === 'all') {
      return true;
    } else {
      throw new Error(
        `Unexpected value from experimentalTransformTest ${transform}. Expected 'spec' | 'all' | 'none'`
      );
    }
  };
  return {
    name: runtime,
    target: {server: 'node', client: 'web', sw: 'webworker'}[runtime],
    entry: {
      main: [
        runtime === 'client' &&
          path.join(__dirname, '../entries/client-public-path.js'),
        runtime === 'server' &&
          path.join(__dirname, '../entries/server-public-path.js'),
        dev &&
          hmr &&
          watch &&
          runtime !== 'server' &&
          `${require.resolve('webpack-hot-middleware/client')}?name=client`,
        // TODO(#46): use 'webpack/hot/signal' instead
        dev &&
          hmr &&
          watch &&
          runtime === 'server' &&
          `${require.resolve('webpack/hot/poll')}?1000`,
        runtime === 'server' &&
          path.join(__dirname, `../entries/${id}-entry.js`), // server-entry or serverless-entry
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
      (runtime === 'client' && !dev) || runtime === 'sw'
        ? 'hidden-source-map'
        : 'cheap-module-source-map',
    output: {
      path: path.join(dir, `.fusion/dist/${env}/${runtime}`),
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
          compiler: id => id === 'server',
          test: babelTester,
          exclude: EXCLUDE_TRANSPILATION_PATTERNS,
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
        (runtime === 'client' || runtime === 'sw') && {
          compiler: id => id === 'client' || id === 'sw',
          test: babelTester,
          exclude: EXCLUDE_TRANSPILATION_PATTERNS,
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
          compiler: id => id === 'client-legacy',
          test: babelTester,
          exclude: EXCLUDE_TRANSPILATION_PATTERNS,
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
        {
          test: /\.graphql$|.gql$/,
          loader: require.resolve('graphql-tag/loader'),
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
            const absolutePath = resolveFrom.silent(context, request);
            // do not bundle external packages and those not whitelisted
            if (absolutePath === null) {
              // if module is missing, skip rewriting to absolute path
              return callback(null, request);
            }
            if (experimentalBundleTest) {
              const bundle = experimentalBundleTest(
                absolutePath,
                'browser-only'
              );
              if (bundle === 'browser-only') {
                // don't bundle on the server
                return callback(null, 'commonjs ' + absolutePath);
              } else if (bundle === 'universal') {
                // bundle on the server
                return callback();
              } else {
                throw new Error(
                  `Unexpected value: ${bundle} from experimentalBundleTest. Expected 'browser-only' | 'universal'.`
                );
              }
            }
            return callback(null, 'commonjs ' + absolutePath);
          }
          // bundle everything else (local files, __*)
          return callback();
        }),
    ].filter(Boolean),
    resolve: {
      aliasFields: [
        (runtime === 'client' || runtime === 'sw') && 'browser',
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
        [fileLoader.alias]: fileLoader.path,
        [chunkIdsLoader.alias]: chunkIdsLoader.path,
        [syncChunkIdsLoader.alias]: syncChunkIdsLoader.path,
        [syncChunkPathsLoader.alias]: syncChunkPathsLoader.path,
        [chunkUrlMapLoader.alias]: chunkUrlMapLoader.path,
        [i18nManifestLoader.alias]: i18nManifestLoader.path,
        [swLoader.alias]: swLoader.path,
        [workerLoader.alias]: workerLoader.path,
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
      runtime === 'server' &&
        new LoaderContextProviderPlugin('optsContext', opts),
      new LoaderContextProviderPlugin(devContextKey, dev),
      runtime === 'server' &&
        new LoaderContextProviderPlugin(
          clientChunkMetadataContextKey,
          state.mergedClientChunkMetadata
        ),
      runtime === 'client'
        ? new I18nDiscoveryPlugin(
            state.i18nDeferredManifest,
            state.i18nManifest
          )
        : new LoaderContextProviderPlugin(
            translationsManifestContextKey,
            state.i18nDeferredManifest
          ),
      !dev && zopfli && zopfliWebpackPlugin,
      !dev && brotliWebpackPlugin,
      !dev && svgoWebpackPlugin,
      // In development, skip the emitting phase on errors to ensure there are
      // no assets emitted that include errors. This fixes an issue with hot reloading
      // server side code and recovering from errors correctly. We only want to do this
      // in dev because the CLI will not exit with an error code if the option is enabled,
      // so failed builds would look like successful ones.
      watch && new webpack.NoEmitOnErrorsPlugin(),
      runtime === 'server'
        ? // Server
          new InstrumentedImportDependencyTemplatePlugin({
            compilation: 'server',
            clientChunkMetadata: state.mergedClientChunkMetadata,
          })
        : /**
           * Client
           * Don't wait for the client manifest on the client.
           * The underlying plugin is able determine client chunk metadata on its own.
           */
          new InstrumentedImportDependencyTemplatePlugin({
            compilation: 'client',
            i18nManifest: state.i18nManifest,
          }),
      dev && hmr && watch && new webpack.HotModuleReplacementPlugin(),
      !dev && runtime === 'client' && new webpack.HashedModuleIdsPlugin(),
      runtime === 'client' &&
        // case-insensitive paths can cause problems
        new CaseSensitivePathsPlugin(),
      runtime === 'server' &&
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: true,
          // Enforce NODE_ENV at runtime
          banner: getEnvBanner(env),
        }),
      new webpack.EnvironmentPlugin({NODE_ENV: env}),
      id === 'client-modern' &&
        new ClientChunkMetadataStateHydratorPlugin(state.clientChunkMetadata),
      id === 'client-modern' &&
        new ChildCompilationPlugin({
          name: 'client-legacy',
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
            new InstrumentedImportDependencyTemplatePlugin({
              compilation: 'client',
              i18nManifest: state.i18nManifest,
            }),
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
      minimize: shouldMinify,
      minimizer: shouldMinify
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

                keep_fnames: opts.preserveNames,
                keep_classnames: opts.preserveNames,
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

function getSrcPath(dir) {
  // resolving to the real path of a known top-level file is required to support Bazel, which symlinks source files individually
  try {
    const real = path.dirname(
      fs.realpathSync(path.resolve(dir, 'package.json'))
    );
    return path.resolve(real, 'src');
  } catch (e) {
    return path.resolve(dir, 'src');
  }
}
