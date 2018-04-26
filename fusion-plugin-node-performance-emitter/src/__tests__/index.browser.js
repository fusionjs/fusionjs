/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';

import NodePerformanceEmitterPlugin from '../browser';

test('null export, as expected', t => {
  t.equal(NodePerformanceEmitterPlugin, null, 'plugin null as expected');
  t.end();
});
