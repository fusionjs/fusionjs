/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/*eslint-env node */

const PLUGIN_NAME = 'MergeChunksPlugin';

class MergeChunksPlugin {
  apply(compiler /*: Object */) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.optimizeChunks.tap(
        {
          name: PLUGIN_NAME,
          // @see https://github.com/webpack/webpack/blob/9fcaa243573005d6fdece9a3f8d89a0e8b399613/lib/OptimizationStages.js#L10
          stage: 10,
        },
        () => {
          if (compilation.chunks.size < 2) {
            return;
          }

          const chunkGraph = compilation.chunkGraph;
          const chunks = Array.from(compilation.chunks);

          const rootChunk = chunks[0];
          for (let i = 1, len = chunks.length; i < len; i++) {
            const chunk = chunks[i];
            if (!chunkGraph.canChunksBeIntegrated(rootChunk, chunk)) {
              throw new Error(
                'Expected to be able to merge all chunks into one'
              );
            }

            chunkGraph.integrateChunks(rootChunk, chunk);
            compilation.chunks.delete(chunk);
          }
        }
      );
    });
  }
}

module.exports = MergeChunksPlugin;
