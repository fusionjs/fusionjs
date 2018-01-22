/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Plugin} from 'fusion-core';

export default options => {
  if (options) {
    throw new Error(
      'Cannot pass parameters to NodePerformanceEmitter in the browser. Try: `app.plugin(NodePerformance, __NODE__ && {...}`'
    );
  }
  return new Plugin({
    Service: function() {
      throw new Error(
        'Cannot instantiate NodePerformanceEmitter in the browser'
      );
    },
  });
};
