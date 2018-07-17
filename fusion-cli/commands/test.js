/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {TestAppRuntime} = require('../build/test-runtime');

exports.run = async function(
  {
    dir = '.',
    watch,
    debug,
    match,
    env,
    testFolder,
    updateSnapshot,
    coverage,
    configPath,
    // Allow snapshots to be updated using `-u` as well as --updateSnapshot.
    // We don't document this argument, but since jest output automatically
    // suggests this as a valid argument, we support it in case it's used.
    u,
  } /*: any */
) {
  const testRuntime = new TestAppRuntime({
    dir,
    watch,
    debug,
    match,
    env,
    testFolder,
    updateSnapshot: updateSnapshot || u,
    coverage,
    configPath,
  });

  // $FlowFixMe
  await testRuntime.run();

  return {
    stop() {
      // $FlowFixMe
      testRuntime.stop();
    },
  };
};
