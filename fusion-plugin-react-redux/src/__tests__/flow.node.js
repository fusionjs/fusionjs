/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import execa from 'execa';
import test from 'tape-cup';

test('Flow tests', async t => {
  // This test is currently failing in release verification due to monorepo construction.
  // Quick fix to disable this running in CI.
  if (process.env.BUILDKITE_PIPELINE_SLUG === 'fusion-release-verification') {
    return t.end();
  }
  const failurePath = 'src/fixtures/failure';
  const successPath = 'src/fixtures/success';
  try {
    await execa.shell(`flow check ${failurePath}`);
    t.fail('Should fail flow check');
  } catch (e) {
    const {stdout} = e;
    t.ok(stdout.includes('Found 1 error'));
  }
  await execa.shell(`flow check ${successPath}`);
  t.end();
});
