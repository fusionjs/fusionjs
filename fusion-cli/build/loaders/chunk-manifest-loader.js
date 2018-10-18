/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
import type {ClientChunkMetadataContext} from "./loader-context.js";
*/
const {clientChunkMetadataContextKey} = require('./loader-context.js');

module.exports = function chunkManifestLoader() {
  this.cacheable(false);
  const chunkMetadataState /*: ClientChunkMetadataContext*/ = this[
    clientChunkMetadataContextKey
  ];
  const callback = this.async();
  chunkMetadataState.result.then(chunkMetadata => {
    callback(null, generateSource(chunkMetadata));
  });
};

function generateSource({chunks, runtimeChunkIds, initialChunkIds}) {
  return [
    `export const chunks = new Map([${Array.from(chunks)
      .map(
        ([id, filename]) =>
          `[${JSON.stringify(id)}, __webpack_public_path__ + "${filename}"]`
      )
      .join(', ')}]);`,
    `export const runtimeChunkIds = new Set(${JSON.stringify(
      Array.from(runtimeChunkIds)
    )});`,
    `export const initialChunkIds = new Set(${JSON.stringify(
      Array.from(initialChunkIds)
    )});`,
  ].join('\n');
}
