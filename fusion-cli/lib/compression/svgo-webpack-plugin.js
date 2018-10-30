/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// svg compressor

const CompressionPlugin = require('compression-webpack-plugin');
const imagemin = require('imagemin');
const svgo = require('imagemin-svgo');

module.exports = new CompressionPlugin({
  filename: '[path]',
  algorithm: function(buf, options, callback) {
    imagemin
      .buffer(buf, {
        plugins: [
          svgo({
            plugins: [{removeUselessDefs: false}, {cleanupIDs: false}],
          }),
        ],
      })
      .then(function(result) {
        callback(null, result);
      });
  },
  test: /\.svg$/,
  threshold: 0,
  minRatio: 1,
});
