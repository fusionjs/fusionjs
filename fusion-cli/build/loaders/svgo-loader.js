/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const { optimize, extendDefaultPlugins } = require('svgo');

module.exports = function svgoLoader(source /*: string*/) {
  const { data, error } = optimize(source, {
    multipass: true,
    plugins: extendDefaultPlugins([
      {
        name: 'removeUselessDefs',
        active: false,
      },
      {
        name: 'cleanupIDs',
        active: false,
      }
    ]),
  });

  if (error) {
    throw new Error(error);
  }

  return data;
};
