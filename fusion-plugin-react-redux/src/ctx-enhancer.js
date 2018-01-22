/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

export default ctx => createStore => (...args) => {
  const store = createStore(...args);
  store.ctx = ctx;
  return store;
};
