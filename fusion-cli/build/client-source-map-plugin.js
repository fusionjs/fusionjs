/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const clientSourceMap = require('./client-source-map');

/**
 * Plugin to get sourcemaps of client JS assets (for consumption in corresponding loader)
 * These ultimately get consumed in the server code (via the loader) for re-mapping
 * client-side error stack traces on the client
 *
 * Generates a mapping of:
 * source filename (string) -> sourcemap (object)
 *
 * NOTE: This plugin should only be run on the client build
 */
class ClientSourceMapPlugin {
  apply(compiler /*: any */) {
    compiler.hooks.invalid.tap('ClientSourceMapPlugin', () => {
      clientSourceMap.invalidate();
    });
    compiler.hooks.emit.tapAsync(
      'ClientSourceMapPlugin',
      (compilation, done) => {
        const sourcemaps = new Map();
        compilation.chunks.forEach(chunk => {
          const len = chunk.files.length;
          if (len % 2 !== 0) {
            throw new Error(
              'Chunk had odd number of files, probably due missing sourcemaps'
            );
          }
          const files = new Map();
          const canonicalSize = len / 2;
          chunk.files.forEach((filename, index) => {
            const canonicalIndex = index % canonicalSize;
            if (!files.has(canonicalIndex)) {
              files.set(canonicalIndex, filename);
            } else {
              sourcemaps.set(
                files.get(canonicalIndex),
                JSON.parse(compilation.assets[filename].source())
              );
            }
          });
        });
        clientSourceMap.set(sourcemaps);
        done();
      }
    );
  }
}

module.exports = ClientSourceMapPlugin;
