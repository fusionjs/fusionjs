/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';

import HelmetPlugin, {Helmet, HelmetProvider} from '../index.js';

test('exports are', t => {
  t.ok(HelmetPlugin, 'Has a default export');
  t.ok(Helmet, 'Has a Helmet export');
  t.ok(HelmetProvider, 'Has a HelmetProvider export');
  t.end();
});
