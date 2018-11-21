/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {allowedJestOptions} = require('../build/jest/cli-options');
const {TestAppRuntime} = require('../build/test-runtime');

exports.run = async function(
  {
    dir = '.',
    debug,
    match,
    env,
    testFolder, // deprecated
    testMatch,
    testRegex,
    configPath,
    // Allow snapshots to be updated using `-u` as well as --updateSnapshot.
    // We don't document this argument, but since jest output automatically
    // suggests this as a valid argument, we support it in case it's used.
    u,
    updateSnapshot,
    collectCoverageFrom,
    // Arguments which are passed through into jest
    ...rest
  } /*: any */
) {
  const jestArgs /*: any */ = {
    updateSnapshot: updateSnapshot || u || false,
  };
  allowedJestOptions.forEach(arg => {
    if (rest[arg]) {
      jestArgs[arg] = rest[arg];
    }
  });

  if ([testFolder, testMatch, testRegex].filter(t => t !== '').length > 1) {
    throw new Error(
      'Only one of testMatch, testRegex and testFolder can be defined at one time'
    );
  }

  const testRuntime = new TestAppRuntime({
    dir,
    debug,
    match,
    env,
    testFolder, // deprecated
    testMatch,
    testRegex,
    configPath,
    collectCoverageFrom,
    jestArgs,
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
