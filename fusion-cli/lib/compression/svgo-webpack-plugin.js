/* eslint-env node */

// svg compressor

const CompressionPlugin = require('compression-webpack-plugin');
const imagemin = require('imagemin');
const svgo = require('imagemin-svgo');

module.exports = new CompressionPlugin({
  asset: '[path]',
  algorithm: function(buf, options, callback) {
    imagemin
      .buffer(buf, {
        plugins: [svgo()],
      })
      .then(function(result) {
        callback(null, result);
      });
  },
  test: /\.svg$/,
  threshold: 0,
  minRatio: 1,
});
