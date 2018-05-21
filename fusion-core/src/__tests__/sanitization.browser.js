/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import {html, unescape} from '../sanitization';

test('sanitization api is not bundled', t => {
  t.equals(html, void 0);
  t.equals(typeof unescape, 'function');
  t.end();
});
