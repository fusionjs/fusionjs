/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const {ConcatSource} = require('webpack').sources;

const PLUGIN_NAME = 'SourceMapPlugin';

/**
 * Webpack plugin to duplicitively write javascript build assets, both with and
 * without the source map comment
 *
 * Adapted from
 * https://github.com/webpack/webpack/issues/6813#issuecomment-516319308
 */
class SourceMapPlugin {
  apply(compiler /*: Object */) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage:
            // need to run after source maps are emitted
            compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          additionalAssets: true,
        },
        (assets) => {
          const jsAssetNames = Object.keys(assets).filter(name =>
            name.endsWith('.js') && !name.endsWith('-with-map.js')
          );

          const nonRuntimeHashes = jsAssetNames
            .map(name => {
              if (/runtime/.test(name)) {
                return false;
              }
              const parts = name.split('-');
              const lastPart = parts[parts.length - 1];
              return lastPart.endsWith('.js') && lastPart.replace(/\.js$/, '');
            })
            .filter(Boolean);

          for (const name of jsAssetNames) {
            try {
              const sources = assets[name] instanceof ConcatSource
                ? assets[name].getChildren()
                : [assets[name]];

              const source = sources[0];
              const sourceMapComment = sources[1] || '';
              const withMapFileName = name.replace(/\.js$/, '-with-map.js');
              const { info: assetInfo } = compilation.getAsset(name);

              compilation.updateAsset(name, source, {
                related: {
                  sourceMap: null
                }
              });

              // Write -with-map asset with source map comment
              if (/runtime/.test(name)) {
                // The runtime chunk is responsible for loading async chunks so
                // we need to rewrite those references
                let withMapSource = source.source();
                for (const hash of nonRuntimeHashes) {
                  withMapSource = withMapSource.replace(
                    `"${String(hash)}"`,
                    `"${String(hash)}-with-map"`
                  );
                }
                compilation.emitAsset(
                  withMapFileName,
                  new ConcatSource(
                    withMapSource,
                    sourceMapComment
                  ),
                  assetInfo
                );
              } else {
                compilation.emitAsset(
                  withMapFileName,
                  new ConcatSource(
                    source,
                    sourceMapComment
                  ),
                  assetInfo
                );
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      );
    });
  }
}

module.exports = SourceMapPlugin;
