/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

module.exports = function buildPreset(context /*: any */, opts /*: any */) {
  return {
    plugins: [],
    presets: [
      [require('./babel-transpilation-preset'), opts],
      [require('./babel-fusion-preset'), opts],
    ],
  };
};
