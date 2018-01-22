/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import tape from 'tape-cup';

import plugin from '../browser';

tape('browser', t => {
  t.doesNotThrow(plugin);
  t.throws(() => plugin({}));
  t.throws(() => plugin().of());
  t.end();
});
