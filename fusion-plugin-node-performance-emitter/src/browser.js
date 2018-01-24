/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import {createPlugin} from 'fusion-core';

const plugin = createPlugin({
  provides: () => {
    throw new Error(
      'Cannot instantiate NodePerformanceEmitter in the browser.  Try __NODE__ && app.register(...)'
    );
  },
});

export default plugin;
