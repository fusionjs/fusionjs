/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const testTarget = require('./test');

exports.run = (...args /*: any */) => {
  // eslint-disable-next-line no-console
  console.warn(
    'Deprecation warning: `fusion test-app` is deprecated, use `fusion test` instead.'
  );
  return testTarget.run(...args);
};
