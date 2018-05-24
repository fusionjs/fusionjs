/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {ConcatSource} = require('webpack-sources');

/**
 * Plugin to instrument the service worker build with a timestamp comment
 * in dev to enforce the browser to refretch the service worker on changes
 * to client code.
 *
 * NOTE: This plugin should only be run on the service worker build
 */
class ServiceWorkerTimestampPlugin {
  apply(compiler /*: any */) {
    compiler.hooks.compilation.tap(
      'ServiceWorkerTimestampPlugin',
      compilation => {
        compilation.hooks.optimizeChunkAssets.tapAsync(
          'ServiceWorkerTimestampPlugin',
          (chunks, cb) => {
            chunks.forEach(chunk => {
              chunk.files.forEach(f => {
                compilation.assets[f] = new ConcatSource(
                  `var ts = ${Date.now()};`,
                  '\n',
                  compilation.assets[f]
                );
              });
            });
            return cb();
          }
        );
      }
    );
  }
}

module.exports = ServiceWorkerTimestampPlugin;
