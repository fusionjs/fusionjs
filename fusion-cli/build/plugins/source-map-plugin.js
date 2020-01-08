/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const {ConcatSource, RawSource} = require('webpack-sources');

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
    const onEmit = (compilation, callback) => {
      const {assets} = compilation;
      const jsAssetNames = Object.keys(assets).filter(name =>
        name.endsWith('.js')
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
          const sourceMapName = `${name}.map`;
          if (!assets[sourceMapName]) continue;

          let sources = assets[name] && assets[name].children;
          if (!sources || sources.length !== 2) continue;

          sources = sources.map(s => (s._value ? s._value : s));
          const source = sources[0];
          const sourceMapComment = sources[1];
          const withMapFileName = name.replace(/\.js$/, '-with-map.js');

          // Write original asset without source map comment
          assets[name] = new RawSource(source);

          // Write -with-map asset with source map comment
          if (/runtime/.test(name)) {
            // The runtime chunk is responsible for loading async chunks so
            // we need to rewrite those references
            let withMapSource = source;
            for (const hash of nonRuntimeHashes) {
              withMapSource = withMapSource.replace(
                `"${String(hash)}"`,
                `"${String(hash)}-with-map"`
              );
            }
            assets[withMapFileName] = new ConcatSource(
              new RawSource(withMapSource),
              sourceMapComment
            );
          } else {
            assets[withMapFileName] = new ConcatSource(
              assets[name],
              sourceMapComment
            );
          }
        } catch (e) {
          console.error(e);
        }
      }

      callback();
    };

    compiler.hooks.emit.tapAsync(PLUGIN_NAME, onEmit);
  }
}

module.exports = SourceMapPlugin;
