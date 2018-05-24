/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {transform} = require('@babel/core');

const plugin = require('../');

module.exports = function doTransform(inputString /*: string */) {
  return (
    transform(inputString.trim(), {
      plugins: [[plugin]],
    })
      .code.trim()
      // Normalize quotes
      .replace(/"/g, "'")
  );
};
