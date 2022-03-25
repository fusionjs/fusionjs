// @flow
/* eslint-env node */
// Adapted from https://github.com/privatenumber/esbuild-loader/blob/6bae9a77af3529216b7377658ff942e5895dca62/src/minify-plugin.ts
const {version, transform, buildSync} = require('esbuild');
const {CachedSource, SourceMapSource, RawSource} = require('webpack').sources;
const JavascriptModulesPlugin = require('webpack/lib/javascript/JavascriptModulesPlugin');
const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers.js');

const isJsFile = /\.[cm]?js(\?.*)?$/i;
const pluginName = 'esbuild-minify';
const granularMinifyConfigs = [
  'minifyIdentifiers',
  'minifySyntax',
  'minifyWhitespace',
];

/*::
type EsbuildTransformOptions = {
  format?: string;
  target?: string;
  sourcemap?: boolean | "external";
  keepNames?: boolean;
  minify?: boolean;
  minifyWhitespace?: boolean;
  minifyIdentifiers?: boolean;
  minifySyntax?: boolean;
}
type EsbuildMinifyPluginOptions = {
  exclude?: string;
  include?: string;
  transformOptions?: EsbuildTransformOptions;
}
*/
class EsbuildMinifyPlugin {
  /*::
  options: EsbuildMinifyPluginOptions;
  */
  constructor(options /*:EsbuildMinifyPluginOptions*/ = {}) {
    const {exclude, include, transformOptions = {}} = options;

    const hasGranularMinificationConfig = granularMinifyConfigs.some(
      (minifyConfig) => minifyConfig in transformOptions
    );

    this.options = {
      exclude,
      include,
      transformOptions: {
        ...transformOptions,
        ...(hasGranularMinificationConfig
          ? null
          : {
              minify: true,
            }),
      },
    };
  }

  apply(compiler /*: any */) {
    const transformOptions /*: EsbuildTransformOptions*/ = {
      // esbuild may include some helper methods to the outer-most scope,
      // need to configure it to wrap the output in an IIFE, in order to
      // prevent global namespace pollution
      // $FlowFixMe
      ...(compiler.options.target === 'web'
        ? {
            format: 'iife',
          }
        : null),
      sourcemap:
        compiler.options.devtool &&
        compiler.options.devtool.includes('source-map')
          ? 'external'
          : false,
      ...this.options.transformOptions,
    };

    // Used for hashing
    const meta = JSON.stringify({
      name: pluginName,
      version,
      transformOptions,
    });

    // Original plugin taps into `compilation` hook that makes it impossible
    // to use different esbuild options between legacy / modern compilations.
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      // esbuild does not perform dead code elimination inside function bodies,
      // while webpack tree-shaking relies on the minifier to remove unused code.
      // Hence need to tap into individual module code generation, where content
      // is unwrapped so that we can let esbuild eliminate unused module exports.
      // @see: https://github.com/evanw/esbuild/issues/639#issuecomment-753683962
      const moduleHooks =
        JavascriptModulesPlugin.getCompilationHooks(compilation);
      moduleHooks.renderModuleContent.tap(
        pluginName,
        (moduleSource, module, renderContext) => {
          const {source, map} = moduleSource.sourceAndMap();
          const sourceAsString = source.toString();
          const resource = module.resource || 'sourced-module.js';

          const {
            // Ignore format option while transforming individual modules
            format,
            ...moduleTransformOptions
          } = transformOptions;

          // Unfortunately the hook we're tapping into is not async, which forces us
          // to use esbuild's sync API. We're also using build API with `bundle` option
          // enabled, because esbuild's transform API does not perform any kind of DCE.
          const result = buildSync({
            ...moduleTransformOptions,
            bundle: true,
            external: ['*'],
            // format is set to `cjs` so there's no additional code addedd (i.e. IIFE)
            format: 'cjs',
            stdin: {
              contents: sourceAsString,
              sourcefile: resource,
            },
            outfile: resource,
            write: false,
          }).outputFiles.reduce(
            (acc, file) => {
              if (file.path.endsWith('.map')) {
                acc.map = file.text;
              } else {
                acc.code = file.text;
              }

              return acc;
            },
            {
              code: '',
              map: '',
            }
          );

          const nextSource = result.map
            ? new SourceMapSource(
                result.code,
                resource,
                result.map,
                sourceAsString,
                map,
                true
              )
            : new RawSource(result.code);

          return new CachedSource(nextSource);
        }
      );
      moduleHooks.chunkHash.tap(pluginName, (chunk, hash) => hash.update(meta));

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          additionalAssets: true,
        },
        async () => await this.transformAssets(compilation, transformOptions)
      );
      compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
        statsPrinter.hooks.print
          .for('asset.info.minimized')
          .tap(pluginName, (minimized, {green, formatFlag}) =>
            minimized ? green(formatFlag('minimized')) : undefined
          );
      });
      compilation.hooks.chunkHash.tap(pluginName, (chunk, hash) =>
        hash.update(meta)
      );
    });
  }

  async transformAssets(
    compilation /*: any*/,
    transformOptions /*: EsbuildTransformOptions */
  ) {
    const {include, exclude} = this.options;
    const assets = compilation.getAssets().filter(
      (asset) =>
        // Filter out already minimized
        !asset.info.minimized &&
        // Filter out by file type
        isJsFile.test(asset.name) &&
        ModuleFilenameHelpers.matchObject({include, exclude}, asset.name)
    );

    await Promise.all(
      assets.map(async (asset) => {
        const {source, map} = asset.source.sourceAndMap();
        const sourceAsString = source.toString();
        const result = await transform(sourceAsString, {
          ...transformOptions,
          sourcefile: asset.name,
        });
        compilation.updateAsset(
          asset.name,
          result.map
            ? new SourceMapSource(
                result.code,
                asset.name,
                result.map,
                sourceAsString,
                map,
                true
              )
            : new RawSource(result.code),
          {
            ...asset.info,
            minimized: true,
          }
        );
      })
    );
  }
}

module.exports = EsbuildMinifyPlugin;
