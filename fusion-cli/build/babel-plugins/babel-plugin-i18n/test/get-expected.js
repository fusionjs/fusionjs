/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const stripIndent = require('strip-indent');
const sharedExpectedContent = require('./shared-expected-content.js');

module.exports = function getExpected(
  inputString /*: string */,
  includeShared /*: boolean */ = true
) {
  const sharedContent = includeShared ? '\n' + sharedExpectedContent() : '';
  return (stripIndent(inputString) + sharedContent).replace(/"/g, "'");
};
