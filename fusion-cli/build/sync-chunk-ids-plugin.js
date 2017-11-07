/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const syncChunkIds = require('./sync-chunk-ids');
const syncChunkPaths = require('./sync-chunk-paths');

/**
 * Generates an array of all chunks that are a non-async dependency
 * of the main app
 */
class SyncChunkIdsPlugin {
  apply(compiler) {
    compiler.plugin('invalid', () => {
      syncChunkIds.invalidate();
      syncChunkPaths.invalidate();
    });

    compiler.plugin('compilation', compilation => {
      compilation.plugin('after-optimize-chunk-assets', () => {
        const chunkIds = compilation.entrypoints.main.chunks.map(c => c.id);
        const chunkPaths = compilation.entrypoints.main.chunks.map(
          c => c.files[0]
        );
        syncChunkIds.set(chunkIds);
        syncChunkPaths.set(chunkPaths);
      });
    });
  }
}

module.exports = SyncChunkIdsPlugin;
