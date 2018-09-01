/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {ClientChunkMetadataState, ClientChunkMetadata} from "../types.js";
*/

class ClientChunkMetadataStateHydrator {
  /*::
  state: ClientChunkMetadataState;
  */
  constructor(state /*: ClientChunkMetadataState*/) {
    this.state = state;
  }
  apply(compiler /*: Object*/) {
    const name = this.constructor.name;

    compiler.hooks.invalid.tap(name, () => {
      this.state.reset();
    });

    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(name, chunks => {
        const fileManifest = chunkIndexFromWebpackChunks(chunks);
        const urlMap = chunkMapFromWebpackChunks(chunks);
        const {criticalPaths, criticalIds} = criticalChunkInfo(
          compilation,
          chunks
        );

        this.state.resolve({fileManifest, urlMap, criticalIds, criticalPaths});
      });
    });
  }
}

module.exports = ClientChunkMetadataStateHydrator;

function chunkIndexFromWebpackChunks(chunks) {
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
      if (chunkIds) {
        chunkIds.add(chunkId);
      }
    });
  });
  return chunkIdsByFile;
}

function chunkMapFromWebpackChunks(chunks) {
  const chunkMap = new Map();
  chunks.forEach(chunk => {
    const [filename] = chunk.files;
    const inner = new Map();
    inner.set('es5', filename);
    chunkMap.set(chunk.id, inner);
  });
  return chunkMap;
}

function criticalChunkInfo(compilation, chunks) {
  const mainEntrypoint = compilation.entrypoints.get('main');
  const chunkIds = mainEntrypoint.chunks.map(c => c.id);
  const chunkPaths = mainEntrypoint.chunks.map(c => c.files[0]);
  return {
    criticalIds: chunkIds,
    criticalPaths: chunkPaths,
  };
}
