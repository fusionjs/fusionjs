/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';

import Plugin from '../index';

tape('plugin api', t => {
  t.ok(Plugin);
  t.end();
});
