/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import execa from 'execa';

test('Flow tests', async done => {
  // This test is currently failing in release verification due to monorepo construction.
  // Quick fix to disable this running in CI.
  if (process.env.BUILDKITE_PIPELINE_SLUG === 'fusion-release-verification') {
    return done();
  }
  const successPath = 'src/fixtures/success';
  await execa.shell(`flow check ${successPath}`);
  done();
}, 10000);
