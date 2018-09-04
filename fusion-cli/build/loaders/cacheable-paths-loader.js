/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
import type {CacheablePathsContext} from "./loader-context.js";
*/
const {cacheablePathsContextKey} = require('./loader-context.js');

module.exports = function cacheablePathsLoader() {
  this.cacheable(false);
  const cacheablePathsState /*: CacheablePathsContext*/ = this[
    cacheablePathsContextKey
  ];
  const callback = this.async();
  cacheablePathsState.result.then(cacheablePaths => {
    callback(null, `module.exports = ${JSON.stringify(cacheablePaths)};`);
  });
};
