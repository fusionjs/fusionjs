/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

class ChunkIdPrefixPlugin {
  /*::
  prefix: string;
  */
  constructor(prefix /*: string */) {
    this.prefix = prefix;
  }

  apply(compiler /*: Object */) {
    const name = this.constructor.name;
    compiler.hooks.thisCompilation.tap(name, () => {
      // NOTE: Need to let webpack assign ids first, before appending custom
      // prefix. Therefore we tap into .compilation hook in .thisCompilation(),
      // this ensures our logic runs after webpack assigned reqired chunk ids.
      compiler.hooks.compilation.tap(name, (compilation) => {
        compilation.hooks.chunkIds.tap(name, chunks => {
          for (const chunk of chunks) {
            const chunkId = `${this.prefix}-${chunk.id}`;

            chunk.id = chunkId;
            chunk.ids = [chunkId];
          }
        });
      });
    });
  }
}

module.exports = ChunkIdPrefixPlugin;
