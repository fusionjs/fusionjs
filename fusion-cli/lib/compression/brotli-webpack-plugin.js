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
const zlib = require('zlib');

class NoopPlugin {
  apply() {}
}

const BrotliPlugin = new CompressionPlugin({
  filename: '[file].br',
  algorithm: 'brotliCompress',
  test: /\.(js|css|html|svg)$/,
  // There's no need to compress server bundle
  exclude: 'server-main.js',
  threshold: 0,
  minRatio: 1,
  deleteOriginalAssets: false,
});

// Flow internal libdef isn't aware brotli exists yet
const hasBrotli = (zlib /*: any */).createBrotliCompress !== void 0;

module.exports = hasBrotli ? BrotliPlugin : NoopPlugin;
