/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import {exec} from '../exec.js';

test('exec', () => {
  expect(exec('echo 1')).toBe('1');
  expect(exec('exit 1')).toBe('');
});
