/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

class ChunkIdPrefixPlugin {
  apply(compiler /*: Object */) {
    const name = this.constructor.name;
    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeChunkIds.tap(name, chunks => {
        for (const chunk of chunks) {
          chunk.id = 10000 + chunk.id;
        }
      });
    });
  }
}

module.exports = ChunkIdPrefixPlugin;
