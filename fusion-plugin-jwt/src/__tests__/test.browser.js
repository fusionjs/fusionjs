/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import JWTBrowser from '../jwt-browser';

tape('browser api', t => {
  t.equal(JWTBrowser, null);
  t.end();
});
