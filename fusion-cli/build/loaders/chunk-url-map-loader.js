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

module.exports = function chunkUrlMapLoader() {
  this.cacheable(false);
  const chunkMetadataState /*: ClientChunkMetadataContext*/ = this[
    clientChunkMetadataContextKey
  ];
  const callback = this.async();
  chunkMetadataState.result.then(chunkMetadata => {
    callback(null, generateSource(chunkMetadata.urlMap));
  });
};

function generateSource(chunkUrlMap) {
  return `module.exports = new Map(
    ${JSON.stringify(
      Array.from(chunkUrlMap.entries()).map(entry => {
        return [entry[0], Array.from(entry[1].entries())];
      })
    )}.map(entry => { //[number, Map<string,string>]
      entry[1] = new Map(
        entry[1].map(group => {
          group[1] = __webpack_public_path__ + group[1];
          return group;
        })
      );
      return entry;
    })
  );`;
}
