/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import * as api from '../index.js';

test('browser API', t => {
  t.equal(api.default.constructor, Function, 'exposes plugin factory');
  t.equal(api.fsStore, undefined, 'noop fsStore');
  t.end();
});
