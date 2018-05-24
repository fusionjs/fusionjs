/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/**
 * Generates a mapping of:
 * module filename (string) -> client build chunk ids (Set<number>)
 * NOTE: This plugin should only be run on the client build
 */

class ChunkModuleManifestPlugin {
  /*:: opts: any; */

  constructor(opts /*: any */ = {}) {
    this.opts = opts;
  }
  apply(compiler /*: any */) {
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
              const chunkIds = chunkIdsByFile.get(path);
              chunkIds && chunkIds.add(chunkId);
            });
          });
          this.opts.onChunkIndex(chunkIdsByFile);
        }
      );
    });
  }
}

module.exports = ChunkModuleManifestPlugin;
