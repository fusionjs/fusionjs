/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {CacheablePathsState} from "../types.js";
*/

const path = require('path');

class CacheablePathsStateHydratorPlugin {
  /*::
  state: CacheablePathsState;
  */
  constructor(state /*: CacheablePathsState*/) {
    this.state = state;
  }
  apply(compiler /*: Object*/) {
    const name = this.constructor.name;

    compiler.hooks.invalid.tap(name, () => {
      this.state.reset();
    });

    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeAssets.tap(name, assets => {
        const cacheableAssets = Object.keys(assets)
          .filter(file => path.extname(file) !== '.map')
          .map(file => path.basename(file));
        this.state.resolve(cacheableAssets);
      });
    });
  }
}

module.exports = CacheablePathsStateHydratorPlugin;
