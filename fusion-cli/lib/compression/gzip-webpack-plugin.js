/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// gzip compressor

const CompressionPlugin = require('compression-webpack-plugin');

module.exports = new CompressionPlugin({
  filename: '[path].gz',
  algorithm: 'gzip',
  test: /\.js$/,
  threshold: 0,
  minRatio: 1,
});
