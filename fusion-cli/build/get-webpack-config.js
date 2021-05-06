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
const ChunkIdPrefixPlugin = require('./plugins/chunk-id-prefix-plugin.js');
const {
  gzipWebpackPlugin,
  brotliWebpackPlugin,
} = require('../lib/compression');
const resolveFrom = require('../lib/resolve-from');
const LoaderContextProviderPlugin = require('./plugins/loader-context-provider-plugin.js');
const ChildCompilationPlugin = require('./plugins/child-compilation-plugin.js');
const NodeSourcePlugin = require('./plugins/node-source-plugin.js');
const {
  chunkIdsLoader,
  fileLoader,
  svgoLoader,
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
  workerKey,
} = require('./loaders/loader-context.js');
const ClientChunkMetadataStateHydratorPlugin = require('./plugins/client-chunk-metadata-state-hydrator-plugin.js');
const InstrumentedImportDependencyTemplatePlugin = require('./plugins/instrumented-import-dependency-template-plugin');
const I18nDiscoveryPlugin = require('./plugins/i18n-discovery-plugin.js');
const SourceMapPlugin = require('./plugins/source-map-plugin.js');
const {version: fusionCLIVersion} = require('../package.json');

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
  BuildStats,
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
  gzip: boolean,
  brotli: boolean,
  minify: boolean,
  skipSourceMaps: boolean,
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
  },
  worker: Object,
  onBuildEnd?: $PropertyType<FusionRC, 'onBuildEnd'>,
  command?: 'dev' | 'build',
  isBuildCacheEnabled: boolean,
|};

type JsonValue = boolean | number | string | null | void | $Shape<{ [string]: JsonValue }> | $ReadOnlyArray<JsonValue>;

type SerializableConfigOpts = {
  [string]: JsonValue
};
*/
const isProjectCode = (modulePath /*:string*/, dir /*:string*/) =>
  modulePath.startsWith(getSrcPath(dir)) ||
  /fusion-cli(\/|\\)(entries|plugins)/.test(modulePath);

const getTransformDefault = (modulePath /*:string*/, dir /*:string*/) =>
  isProjectCode(modulePath, dir) ? 'all' : 'spec';
module.exports = {
  getWebpackConfig,
  getTransformDefault,
};

const WEBPACK_NODE_OPTIONS = new Set(['__filename', '__dirname', 'global']);

function getWebpackConfig(opts /*: WebpackConfigOpts */) {
  const {
    id,
    dev,
    dir,
    hmr,
    watch,
    state,
    fusionConfig,
    zopfli, // TODO: Remove redundant zopfli option
    gzip,
    brotli,
    minify,
    skipSourceMaps,
    legacyPkgConfig = {},
    worker,
    onBuildEnd,
    command,
    preserveNames,
    isBuildCacheEnabled,
    // ACHTUNG:
    // Adding new config option? Please do not forget to add it to `cacheVersionVars`
  } = opts;
  const main = 'src/main.js';

  if (!fs.existsSync(path.join(dir, main))) {
    throw new Error(`Project directory must contain a ${main} file`);
  }

  const runtime = COMPILATIONS[id];
  const mode = dev ? 'development' : 'production';
  const env = dev ? 'development' : 'production';
  const shouldMinify = !dev && minify;
  const isHMREnabled = dev && hmr && watch;
  const target = {server: 'node', client: 'web', sw: 'webworker'}[runtime];
  const fusionBuildFolder = path.resolve(dir, '.fusion');

  // Both options default to true, but if `--zopfli=false`
  // it should be respected for backwards compatibility
  const shouldGzip = zopfli && gzip;

  const babelConfigData = {
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
  };

  const isAssumeNoImportSideEffectsEnabled =
    fusionConfig.assumeNoImportSideEffects === true ||
    Array.isArray(fusionConfig.assumeNoImportSideEffects);

  const isDefaultImportSideEffectsEnabled = !(
    fusionConfig.defaultImportSideEffects === false ||
    Array.isArray(fusionConfig.defaultImportSideEffects)
  );

  const babelOverridesData = {
    dev: dev,
    fusionTransforms: true,
    assumeNoImportSideEffects: isAssumeNoImportSideEffectsEnabled,
    target: runtime === 'server' ? 'node-bundled' : 'browser-modern',
    specOnly: false,
  };

  const legacyBabelOverridesData = {
    ...babelOverridesData,
    target: runtime === 'server' ? 'node-bundled' : 'browser-legacy',
  };

  const {experimentalBundleTest, experimentalTransformTest} = fusionConfig;
  const babelTester = experimentalTransformTest
    ? modulePath => {
        if (!JS_EXT_PATTERN.test(modulePath)) {
          return false;
        }
        const transform = experimentalTransformTest(
          modulePath,
          getTransformDefault(modulePath, dir)
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

  const nodeBuiltins = Object.assign(
    {
      // Polyfilling process involves lots of cruft. Better to explicitly inline env value statically
      process: false,
      // We definitely don't want automatic Buffer polyfills. This should be explicit and in userland code
      Buffer: false,
      // This is required until we have better tree shaking. See https://github.com/fusionjs/fusion-cli/issues/254
      child_process: 'empty',
      cluster: 'empty',
      crypto: 'empty',
      dgram: 'empty',
      dns: 'empty',
      fs: 'empty',
      http2: 'empty',
      module: 'empty',
      net: 'empty',
      readline: 'empty',
      repl: 'empty',
      tls: 'empty',
    },
    legacyPkgConfig.node,
    fusionConfig.nodeBuiltins
  );

  // Used to determine if this is an initial or incremental build
  let isIncrementalBuild = false;

  // Invalidate cache when any of these values change
  const cacheVersionVars/*: SerializableConfigOpts */ = {
    id,
    dev,
    dir,
    hmr,
    watch,
    zopfli,
    gzip,
    brotli,
    minify,
    skipSourceMaps,
    preserveNames,
    nodeBuiltins,
    fusionCLIVersion,
  };
  const cacheDirectory = path.join(fusionBuildFolder, '.build-cache');
  const isBuildCachePersistent =
    isBuildCacheEnabled && !isEmptyDir(cacheDirectory);

  return {
    ...(isBuildCacheEnabled
      ? {
          cache: {
            type: 'filesystem',
            cacheDirectory,
            name: `${runtime}-${mode}${isHMREnabled ? '-hmr' : ''}`,
            version: JSON.stringify(cacheVersionVars),
            buildDependencies: {
              // Invalidate cache when any of these files, or any of their dependencies change
              config: [
                __filename,
                // .fusionrc contains some non-serializable options (e.g. functions), so we need to
                // tell webpack to track any changes to this file to invalidate the build cache
                fusionConfig && fusionConfig.configPath,
              ].filter(Boolean),
            },
          },
        }
      : null),
    watchOptions: {
      // Ignore Yarn PnP immutable paths, as well as invalid virtual paths
      // @see: https://github.com/yarnpkg/berry/blob/5869e5934dcd7491422c2045675bcea2944708cc/packages/yarnpkg-fslib/sources/VirtualFS.ts#L8-L14
      ignored: /(\/\.yarn(\/[^/]+)*\/cache\/[^\/]+\.zip|\/\.yarn\/(?:\$\$virtual|__virtual__)(?!(\/[^/]+){2}\/.+$))/,
    },
    name: runtime,
    target,
    entry: {
      main: [
        runtime === 'client' &&
          path.join(__dirname, '../entries/client-public-path.js'),
        runtime === 'server' &&
          path.join(__dirname, '../entries/server-public-path.js'),
        isHMREnabled &&
          runtime !== 'server' &&
          `${require.resolve('webpack-hot-middleware/client')}?name=client`,
        // TODO: revisit server-side HMR (we currently restart the server)
        // TODO(#46): use 'webpack/hot/signal' instead
        // isHMREnabled &&
        //   runtime === 'server' &&
        //   `${require.resolve('webpack/hot/poll')}?1000`,
        runtime === 'server' &&
          path.join(__dirname, `../entries/${id}-entry.js`), // server-entry or serverless-entry
        runtime === 'client' &&
          path.join(__dirname, '../entries/client-entry.js'),
      ].filter(Boolean),
    },
    mode,
    // TODO(#47): Do we need to do something different here for production?
    stats: 'minimal',
    /**
     * `cheap-module-source-map` is best supported by Chrome DevTools
     * See: https://github.com/webpack/webpack/issues/2145#issuecomment-294361203
     *
     * We use `source-map` in production but effectively create a
     * `hidden-source-map` using SourceMapPlugin to strip the comment.
     *
     * Chrome DevTools support doesn't matter in these case.
     * We only use it for generating nice stack traces
     */
    // TODO(#6): what about node v8 inspector?
    devtool: skipSourceMaps
      ? false
      : runtime === 'client' && !dev
      ? 'source-map'
      : runtime === 'sw'
      ? 'hidden-source-map'
      : 'cheap-module-source-map',
    output: {
      uniqueName: 'Fusion',
      path: path.join(fusionBuildFolder, 'dist', env, runtime),
      filename:
        runtime === 'server'
          ? 'server-main.js'
          : dev
          ? 'client-[name].js'
          : 'client-[name]-[chunkhash].js',
      ...(runtime === 'server'
        ? {
            libraryTarget: 'commonjs2',
          }
        : null),
      // This is the recommended default.
      // See https://webpack.js.org/configuration/output/#output-sourcemapfilename
      sourceMapFilename: `[file].map`,
      // NOTE: Breaking change in webpack v5
      // Webpack 5 has new default automatic `publicPath`, which is not well supported in
      // legacy browsers. Setting it to a static value makes it bypass this new behavior.
      // Fusion.js will set __webpack_public_path__ at runtime based on ENV variables.
      publicPath: '',
      crossOriginLoading: 'anonymous',
      devtoolModuleFilenameTemplate: (info /*: Object */) => {
        // always return absolute paths in order to get sensible source map explorer visualization
        return path.isAbsolute(info.absoluteResourcePath)
          ? info.absoluteResourcePath
          : path.join(dir, info.absoluteResourcePath);
      },
    },
    performance: false,
    context: dir,
    node: Object.assign(
      {
        // We want these to resolve to the original file source location, not the compiled location
        // in the future, we may want to consider using `import.meta`
        __filename: true,
        __dirname: true,
      },
      Object.entries(nodeBuiltins)
        .filter(([key]) => WEBPACK_NODE_OPTIONS.has(key))
        .reduce((acc, [key, val]) => {
          acc[key] = val;

          return acc;
        }, {})
    ),
    module: {
      // NOTE: Breaking change in webpack v5
      // Webpack v5 does not allow named imports from JSON-modules, that makes it
      // hard to resolve for some apps dependent on packages with such imports.
      // Hence need to relax this rule to produce a warning instead of an error
      // @see: https://webpack.js.org/blog/2020-10-10-webpack-5-release/#json-modules
      strictExportPresence: false,
      rules: [
        // NOTE: Breaking change in webpack v5
        // Webpack aligns with the spec for ECMAScript module,
        // where import paths need to be fully specified
        // @see: https://github.com/webpack/webpack/issues/11467#issuecomment-691702706
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
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
                dir,
                configCacheKey: 'server-config',
                overrideCacheKey: 'server-override',
                babelConfigData: {...babelConfigData},
                /**
                 * Fusion-specific transforms (not applied to node_modules)
                 */
                overrides: [
                  {
                    ...babelOverridesData,
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
                dir,
                configCacheKey: 'client-config',
                overrideCacheKey: 'client-override',
                babelConfigData: {...babelConfigData},
                /**
                 * Fusion-specific transforms (not applied to node_modules)
                 */
                overrides: [
                  {
                    ...babelOverridesData,
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
                dir,
                configCacheKey: 'legacy-config',
                overrideCacheKey: 'legacy-override',
                babelConfigData: {
                  target:
                    runtime === 'server' ? 'node-bundled' : 'browser-legacy',
                  specOnly: true,
                  plugins:
                    fusionConfig.babel && fusionConfig.babel.plugins
                      ? fusionConfig.babel.plugins
                      : [],
                  presets:
                    fusionConfig.babel && fusionConfig.babel.presets
                      ? fusionConfig.babel.presets
                      : [],
                },
                /**
                 * Fusion-specific transforms (not applied to node_modules)
                 */
                overrides: [
                  {
                    ...legacyBabelOverridesData,
                  },
                ],
              },
            },
          ],
        },
        // Need to disable auto-parsing JSON loaded via `assetUrl()` construct
        {
          test: /\.json$/,
          resourceQuery: /assetUrl=true/,
          type: 'javascript/auto',
        },
        {
          test: /\.svg$/,
          resourceQuery: /assetUrl=true/,
          loader: svgoLoader.path,
        },
        {
          test: /\.ya?ml$/,
          type: 'json',
          loader: require.resolve('yaml-loader'),
        },
        {
          test: /\.graphql$|.gql$/,
          loader: require.resolve('graphql-tag/loader'),
        },
        (isAssumeNoImportSideEffectsEnabled ||
          !isDefaultImportSideEffectsEnabled) && {
            sideEffects: false,
            ...(isAssumeNoImportSideEffectsEnabled
              ? null
              : {
                  // `defaultImportSideEffects: false` only applies to imports to other packages from within
                  // application. Imports within other packages to other packages will not be affected.
                  issuer: dir,
                }),
            test: modulePath =>
              // NOTE: Breaking change in webpack v5
              // Need to skip modules generated via custom webpack loaders, for which there's no module resource set
              // @see: https://github.com/webpack/webpack/blob/v4.46.0/lib/RuleSet.js#L487
              Boolean(modulePath) &&
              // `defaultImportSideEffects: false` does not apply to application code,
              // in which case we defer to the `sideEffects` in app-root package.json
              (isAssumeNoImportSideEffectsEnabled ||
                modulePath.startsWith(dir)),
            descriptionData: {
              // We need to respect the value set in package.json whenever possible, hence
              // only set module as sideEffects free if sideEffects field was not defined.
              sideEffects: val => !Boolean(val),
              ...(function () {
                const ignoredPackages = new Set([
                  'core-js',
                  'regenerator-runtime',
                  ...(isAssumeNoImportSideEffectsEnabled &&
                    Array.isArray(fusionConfig.assumeNoImportSideEffects)
                    ? fusionConfig.assumeNoImportSideEffects
                    : []),
                  ...(!isDefaultImportSideEffectsEnabled &&
                    Array.isArray(fusionConfig.defaultImportSideEffects)
                    ? fusionConfig.defaultImportSideEffects
                    : []),
                ]);

                return {
                  name: packageName => !ignoredPackages.has(packageName),
                };
              })(),
            },
          },
      ].filter(Boolean),
    },
    externals: [
      runtime === 'server' &&
        (({ context, request }, callback) => {
          if (/^[@a-z\-0-9]+/.test(request)) {
            const absolutePath = resolveFrom.silent(context, request);
            // do not bundle external packages and those not whitelisted
            if (typeof absolutePath !== 'string') {
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
      symlinks: process.env.NODE_PRESERVE_SYMLINKS ? false : true,
      aliasFields: [
        (runtime === 'client' || runtime === 'sw') && 'browser',
        'es2015',
        'es2017',
      ].filter(Boolean),
      alias: {
        // we replace need to set the path to user application at build-time
        __FUSION_ENTRY_PATH__: path.join(dir, main),
        __ENV__: env,
        ...(process.env.ENABLE_REACT_PROFILER === 'true'
          ? {
              'react-dom$': 'react-dom/profiling',
              'scheduler/tracing': 'scheduler/tracing-profiling',
            }
          : {}),
      },
      // NOTE: Breaking change in webpack v5
      // Need to prioritize .mjs extension to keep similar behavior to
      // webpack v4, also some packages lack fully specified path in esm
      // @see: https://github.com/webpack/webpack/issues/11467#issuecomment-691702706
      extensions: ['.mjs', '...'],
    },
    resolveLoader: {
      symlinks: process.env.NODE_PRESERVE_SYMLINKS ? false : true,
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
      runtime === 'client' && !dev && !skipSourceMaps && new SourceMapPlugin(),
      // NOTE: Breaking change in webpack v5
      // Need to provide same API to source node modules in client bundles
      // @see: https://github.com/webpack/webpack/blob/v4.46.0/lib/node/NodeSourcePlugin.js#L83-L94
      target !== 'node' &&
        new webpack.ProvidePlugin({
          ...(nodeBuiltins.Buffer
            ? {
                Buffer: ['buffer', 'Buffer'],
              }
            : null),
          ...(nodeBuiltins.process
            ? {
                process: 'process',
              }
            : null),
        }),
      // NOTE: Breaking change in webpack v5
      // Need to provide same API to source node modules in client bundles
      // @see: https://github.com/webpack/webpack/blob/v4.46.0/lib/node/NodeSourcePlugin.js#L21-L36
      target !== 'node' && new NodeSourcePlugin(nodeBuiltins),
      runtime === 'server' &&
        new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
      onBuildEnd
        ? new ProgressBarPlugin({
            callback: progressBar => {
              const buildTime = new Date() - progressBar.start;
              const buildStats/*: BuildStats*/ = {
                command,
                target: id,
                mode,
                path: dir,
                watch,
                minify,
                skipSourceMaps,
                buildTime,
                isIncrementalBuild,
                isBuildCacheEnabled,
                isBuildCachePersistent,
                version: fusionCLIVersion,
                buildToolVersion: 'webpack v5',
              };
              isIncrementalBuild = true;
              return onBuildEnd(buildStats);
            },
          })
        : new ProgressBarPlugin(),
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
      new LoaderContextProviderPlugin(workerKey, worker),
      !dev && shouldGzip && gzipWebpackPlugin,
      !dev && brotli && brotliWebpackPlugin,
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
      // @TODO: revisit server-side HMR (we currently restart the server)
      isHMREnabled &&
        runtime !== 'server' &&
        new webpack.HotModuleReplacementPlugin(),
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
          enabledState: state.legacyBuildEnabled,
          outputOptions: {
            // Can not change target properties for child compiler
            // Need to downgrade the environment options manually
            // @see: https://webpack.js.org/configuration/output/#outputenvironment
            environment: {
              arrowFunction: false,
              bigIntLiteral: false,
              const: false,
              destructuring: false,
              dynamicImport: false,
              forOf: false,
              module: false,
            },
            filename: dev
              ? 'client-legacy-[name].js'
              : 'client-legacy-[name]-[chunkhash].js',
            chunkFilename: dev
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
            new ChunkIdPrefixPlugin('legacy'),
          ],
        }),
    ].filter(Boolean),
    optimization: {
      // In development, skip the emitting phase on errors to ensure there are
      // no assets emitted that include errors. This fixes an issue with hot reloading
      // server side code and recovering from errors correctly. We only want to do this
      // in dev because the CLI will not exit with an error code if the option is enabled,
      // so failed builds would look like successful ones.
      ...(watch
        ? {
            emitOnErrors: false,
          }
        : null),
      runtimeChunk: runtime === 'client' && {name: 'runtime'},
      splitChunks:
        runtime !== 'client'
          ? void 0
          : fusionConfig.splitChunks
          ? // Tilde character in filenames is not well supported
            // https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
            {...fusionConfig.splitChunks, automaticNameDelimiter: '-'}
          : {
              chunks: 'async',
              automaticNameDelimiter: '-',
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
              extractComments: false,
              terserOptions: {
                parse: {
                  ecma: 2017,
                },
                compress: {
                  ecma: 5,
                  // typeofs: true (default) transforms typeof foo == "undefined" into foo === void 0.
                  // This mangles mapbox-gl creating an error when used alongside with window global mangling:
                  // https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/189
                  typeofs: false,

                  // inline=2 can cause const reassignment
                  // https://github.com/mishoo/UglifyJS2/issues/2842
                  inline: 1,
                },
                format: {
                  ecma: 5,
                },
                keep_fnames: preserveNames,
                keep_classnames: preserveNames,
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

function getSrcPath(dir) {
  // resolving to the real path of a known top-level file is required to support Bazel, which symlinks source files individually
  if (process.env.NODE_PRESERVE_SYMLINKS) {
    return path.resolve(dir, 'src');
  }
  try {
    const real = path.dirname(
      fs.realpathSync(path.resolve(dir, 'package.json'))
    );
    return path.resolve(real, 'src');
  } catch (e) {
    return path.resolve(dir, 'src');
  }
}

function isEmptyDir(dir) {
  try {
    return fs.readdirSync(dir).length === 0;
  } catch (e) {
    return true;
  }
}
