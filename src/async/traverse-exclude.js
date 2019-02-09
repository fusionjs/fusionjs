/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import prepared from './prepared.js';

// Stops the traversal at this node. Useful for optimizing the prepare traversal
// to visit the minimum number of nodes
export default prepared(() => Promise.resolve(), {
  componentDidMount: false,
  componentWillReceiveProps: false,
  componentDidUpdate: false,
  defer: true,
});
