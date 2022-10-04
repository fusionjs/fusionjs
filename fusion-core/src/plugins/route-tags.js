/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {memoize} from '../memoize';
import {createPlugin} from '../create-plugin';

export default createPlugin({
  provides: () => {
    return {
      from: memoize((ctx) => {
        return {
          name: 'unknown_route',
        };
      }),
    };
  },
});
