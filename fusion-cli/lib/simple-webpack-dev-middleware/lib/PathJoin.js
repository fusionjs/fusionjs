/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

function pathJoin(a /*: any */, b /*: any */) {
  return a == '/' ? '/' + b : (a || '') + '/' + b;
}

module.exports = pathJoin;
