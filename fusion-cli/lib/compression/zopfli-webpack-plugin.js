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
const zopfliCompress = require('node-zopfli').compress;

module.exports = new CompressionPlugin({
  asset: '[path].gz',
  algorithm: function(buf, options, callback) {
    zopfliCompress(
      buf,
      'gzip',
      {
        numiterations: 15,
        blocksplitting: true,
      },
      callback
    );
  },
  test: /\.js$/,
  threshold: 0,
  minRatio: 1,
});
