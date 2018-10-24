/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import * as api from '../index.js';

test('server API', t => {
  t.equal(api.default.constructor, Function, 'exposes plugin factory');
  t.equal(api.fsStore.constructor, Object, 'exposes fsStore');
  t.equal(typeof api.fsStore.store, 'function', 'exposes fsStore.store');
  t.equal(
    typeof api.fsStore.storeSync,
    'function',
    'exposes fsStore.storeSync'
  );
  t.end();
});
