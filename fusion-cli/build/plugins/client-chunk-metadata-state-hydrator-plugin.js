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

const assert = require('assert');

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

    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.afterProcessAssets.tap(name, () => {
        const chunks = compilation.chunks;
        const fileManifest = chunkIndexFromWebpackChunks(compilation.chunkGraph, chunks);
        const urlMap = chunkMapFromWebpackChunks(chunks);
        const {criticalPaths, criticalIds} = criticalChunkInfo(
          compilation,
          chunks
        );

        this.state.resolve({
          fileManifest,
          urlMap,
          criticalIds,
          criticalPaths,
          ...getChunkInfo(compilation, chunks),
        });
      });
    });
  }
}

module.exports = ClientChunkMetadataStateHydrator;

function chunkIndexFromWebpackChunks(chunkGraph, chunks) {
  const chunkIdsByFile = new Map();

  for (const c of chunks) {
    const chunkId = c.id;

    const files = [];

    // Iterate through the groups this chunk belongs to, adding the files of the other chunks in that group as well
    for (const g of c.groupsIterable) {
      for (const cc of g.chunks) {
        for (const m of chunkGraph.getChunkModulesIterable(cc)) {
          if (m.resource) {
            files.push(m.resource);
          } else if (m.modules) {
            files.push(...m.modules.map(module => module.resource));
          }
        }
      }
    }

    for (const path of files) {
      if (!chunkIdsByFile.has(path)) {
        chunkIdsByFile.set(path, new Set());
      }
      const chunkIds = chunkIdsByFile.get(path);
      if (chunkIds) {
        chunkIds.add(chunkId);
      }
    }
  }

  return chunkIdsByFile;
}

function chunkMapFromWebpackChunks(chunks) {
  const chunkMap = new Map();
  chunks.forEach(chunk => {
    const filename = chunk.files.values().next().value;
    const inner = new Map();
    inner.set('es5', filename);
    chunkMap.set(chunk.id, inner);
  });
  return chunkMap;
}

function getChunkInfo(compilation, chunks) {
  assert(
    compilation.entrypoints.size === 1,
    `fusion-cli expects there to be a single entrypoint, but there was ${compilation.entrypoints.size}. This is a bug in fusion-cli.`
  );
  const allChunks = new Map();
  const runtimeChunkIds = new Set();
  const initialChunkIds = new Set();

  for (const chunk of chunks) {
    allChunks.set(chunk.id, chunk.files.values().next().value);
    if (chunk.hasRuntime()) {
      runtimeChunkIds.add(chunk.id);
    } else if (chunk.canBeInitial()) {
      initialChunkIds.add(chunk.id);
    }
  }

  assert(
    runtimeChunkIds.size === 1,
    `fusion-cli expects there to be a single runtime chunk, but there was ${runtimeChunkIds.size}. This is a bug in fusion-cli.`
  );

  return {
    chunks: allChunks,
    runtimeChunkIds,
    initialChunkIds,
  };
}

function criticalChunkInfo(compilation, chunks) {
  const mainEntrypoint = compilation.entrypoints.get('main');
  const chunkIds = mainEntrypoint.chunks.map(c => c.id);
  const chunkPaths = mainEntrypoint.chunks.map(c => c.files.values().next().value);
  return {
    criticalIds: chunkIds,
    criticalPaths: chunkPaths,
  };
}
