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

let previousArr;
let previousResult;
function mergeChunkMetadata(
  arr /*: Array<ClientChunkMetadata> */
) /*: ClientChunkMetadata */ {
  if (arr.length === 1) {
    return arr[0];
  }

  if (previousArr && previousResult) {
    if (
      previousArr === arr ||
      (previousArr.length === arr.length &&
        previousArr.every((state, idx) => arr[idx] === state))
    ) {
      return previousResult;
    }
  }
  previousArr = arr;

  const base = {
    fileManifest: new Map(),
    urlMap: new Map(),
    criticalPaths: [],
    criticalIds: [],
    chunks: new Map(),
    runtimeChunkIds: new Set(),
    initialChunkIds: new Set(),
  };

  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    for (let [key, val] of item.fileManifest) {
      if (base.fileManifest.has(key)) {
        let set = base.fileManifest.get(key);
        for (let el of val) {
          // $FlowFixMe
          set.add(el);
        }
      } else {
        base.fileManifest.set(key, val);
      }
    }
    for (let [key, val] of item.urlMap) {
      base.urlMap.set(key, val);
    }
    for (let [key, val] of item.chunks) {
      base.chunks.set(key, val);
    }
    for (let val of item.runtimeChunkIds) {
      base.runtimeChunkIds.add(val);
    }
    for (let val of item.initialChunkIds) {
      base.initialChunkIds.add(val);
    }
    for (let path of item.criticalPaths) {
      if (!base.criticalPaths.includes(path)) {
        base.criticalPaths.push(path);
      }
    }
    for (let id of item.criticalIds) {
      if (!base.criticalIds.includes(id)) {
        base.criticalIds.push(id);
      }
    }
  }

  return (previousResult = base);
}

module.exports = mergeChunkMetadata;
