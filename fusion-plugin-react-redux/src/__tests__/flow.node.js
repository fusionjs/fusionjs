/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import execa from 'execa';
import test from 'tape-cup';

test('Flow tests', async t => {
  const failurePath = 'src/fixtures/failure/';
  const successPath = 'src/fixtures/success/';
  try {
    await execa.shell(`yarn flow check ${failurePath}`);
    t.fail('Should fail flow check');
  } catch (e) {
    const {stdout} = e;
    t.ok(stdout.includes('Found 1 error'));
  }
  await execa.shell(`yarn flow check ${successPath}`);
  t.end();
});
