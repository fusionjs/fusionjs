/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {createPlugin, memoize} from 'fusion-core';

// $FlowFixMe
import {initialChunkIds} from '../build/loaders/chunk-manifest-loader.js!'; // eslint-disable-line

export default createPlugin({
  provides: () => {
    return {
      from: memoize(() => {
        const chunkIds = new Set();
        for (const chunkId of initialChunkIds) {
          chunkIds.add(chunkId);
        }
        return new Set();
      }),
    };
  },
});
