/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const syncChunkIds = require('./sync-chunk-ids');
const syncChunkPaths = require('./sync-chunk-paths');

/**
 * Generates an array of all chunks that are a non-async dependency
 * of the main app
 */
class SyncChunkIdsPlugin {
  apply(compiler /*: any */) {
    compiler.hooks.invalid.tap('SyncChunkIdsPlugin', () => {
      syncChunkIds.invalidate();
      syncChunkPaths.invalidate();
    });

    compiler.hooks.compilation.tap('SyncChunkIdsPlugin', compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(
        'SyncChunkIdsPlugin',
        () => {
          const mainEntrypoint = compilation.entrypoints.get('main');
          const chunkIds = mainEntrypoint.chunks.map(c => c.id);
          const chunkPaths = mainEntrypoint.chunks.map(c => c.files[0]);
          syncChunkIds.set(chunkIds);
          syncChunkPaths.set(chunkPaths);
        }
      );
    });
  }
}

module.exports = SyncChunkIdsPlugin;
