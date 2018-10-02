/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// brotli compressor (gzip alternative w/ better compression, but less browser support)

const CompressionPlugin = require('compression-webpack-plugin');
const brotliCompress = require('iltorb').compress;

module.exports = new CompressionPlugin({
  filename: '[path].br',
  algorithm: function(buf, options, callback) {
    brotliCompress(
      buf,
      {
        mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
        quality: 11, // 0 - 11
        lgwin: 22, // window size
        lgblock: 0, // block size
      },
      callback
    );
  },
  test: /\.js$/,
  threshold: 0,
  minRatio: 1,
});
