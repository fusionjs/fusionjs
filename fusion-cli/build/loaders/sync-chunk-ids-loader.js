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

module.exports = function syncChunkIdsLoader() {
  const chunkMetadataState /*: ClientChunkMetadataContext*/ = this[
    clientChunkMetadataContextKey
  ];
  this.cacheable(false);
  const callback = this.async();

  chunkMetadataState.result.then(chunkMetadata => {
    callback(
      null,
      `module.exports = ${JSON.stringify(chunkMetadata.criticalIds)};`
    );
  });
};
