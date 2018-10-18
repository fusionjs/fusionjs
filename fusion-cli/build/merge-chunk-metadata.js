/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
import type {ClientChunkMetadata} from "./types.js";
*/

module.exports = mergeChunkMetadata;

function mergeChunkMetadata(
  arr /*: Array<ClientChunkMetadata> */
) /*: ClientChunkMetadata */ {
  const base = {
    fileManifest: new Map(),
    urlMap: new Map(),
    criticalPaths: [],
    criticalIds: [],
    chunks: new Map(),
    runtimeChunkIds: new Set(),
    initialChunkIds: new Set(),
  };
  arr = arr.reverse();

  return arr.reduce((acc, item) => {
    for (let [key, val] of item.fileManifest) {
      if (acc.fileManifest.has(key)) {
        let set = acc.fileManifest.get(key);
        for (let el of val) {
          // $FlowFixMe
          set.add(el);
        }
      } else {
        acc.fileManifest.set(key, val);
      }
    }
    for (let [key, val] of item.urlMap) {
      acc.urlMap.set(key, val);
    }
    for (let [key, val] of item.chunks) {
      acc.chunks.set(key, val);
    }
    for (let val of item.runtimeChunkIds) {
      acc.runtimeChunkIds.add(val);
    }
    for (let val of item.initialChunkIds) {
      acc.initialChunkIds.add(val);
    }
    for (let path of item.criticalPaths) {
      if (!acc.criticalPaths.includes(path)) {
        acc.criticalPaths.push(path);
      }
    }
    for (let id of item.criticalIds) {
      if (!acc.criticalIds.includes(id)) {
        acc.criticalIds.push(id);
      }
    }
    return acc;
  }, base);
}
