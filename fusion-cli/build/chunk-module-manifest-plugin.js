/* eslint-env node */

/**
 * Generates a mapping of:
 * module filename (string) -> client build chunk ids (Set<number>)
 * NOTE: This plugin should only be run on the client build
 */

class ChunkModuleManifestPlugin {
  constructor(opts = {}) {
    this.opts = opts;
  }
  apply(compiler) {
    compiler.hooks.invalid.tap('ChunkModuleManifestPlugin', () => {
      this.opts.onInvalidate();
    });

    compiler.hooks.compilation.tap('ChunkModuleManifestPlugin', compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(
        'ChunkModuleManifestPlugin',
        chunks => {
          const chunkIdsByFile = new Map();
          chunks.forEach(c => {
            const chunkId = c.id;
            const files = Array.from(c.modulesIterable, m => {
              if (m.resource) {
                return m.resource;
              }
              if (m.modules) {
                return m.modules.map(module => module.resource);
              }
              return [];
            }).reduce((list, next) => {
              return list.concat(next);
            }, []);
            files.forEach(path => {
              if (!chunkIdsByFile.has(path)) {
                chunkIdsByFile.set(path, new Set());
              }
              chunkIdsByFile.get(path).add(chunkId);
            });
          });
          this.opts.onChunkIndex(chunkIdsByFile);
        }
      );
    });
  }
}

module.exports = ChunkModuleManifestPlugin;
