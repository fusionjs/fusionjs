/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import test from 'tape-cup';
import {exec} from '../exec.js';

test('exec', t => {
  t.equal(exec('echo 1'), '1', 'success returns stdout');
  t.equal(exec('exit 1'), '', 'failure returns empty string');
  t.end();
});
