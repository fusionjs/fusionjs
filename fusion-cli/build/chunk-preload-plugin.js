/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/**
 * Webpack plugin for being able to mark async chunks as being already preloaded
 * This is meant for the client and ensures that webpack only requests for chunks
 * once. This is necessary because we automatically inline scripts for async chunks
 * that are used during the server side render. We use Object.defineProperty to make
 * the values lazy so `new Promise` is not executed until the promise polyfill is loaded.
 */

const Template = require('webpack/lib/Template');

class ChunkPreloadPlugin {
  apply(compiler /*: any */) {
    compiler.hooks.compilation.tap('ChunkPreloadPlugin', function(compilation) {
      compilation.mainTemplate.hooks.localVars.tap(
        'ChunkPreloadPlugin',
        function(source) {
          var buf = [source];
          buf.push('');
          buf.push('// chunk preloading');
          buf.push(
            `
  if (window.__PRELOADED_CHUNKS__) {
    window.__PRELOADED_CHUNKS__.forEach(function(chunkId) {
      var result;
      Object.defineProperty(installedChunks, chunkId, {
        get: function() {
          if (result) {
            return result;
          }
          var promise = new Promise(function(resolve, reject) {
            result = [resolve, reject];
          });
          result[2] = promise;
          return result;
        }
      });
    });
  }

  var rejectChunkPreload = function(chunkId) {
    var chunk = installedChunks[chunkId];
    if(chunk !== 0) {
      if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
      installedChunks[chunkId] = undefined;
    }
  }

  window.__HANDLE_ERROR = rejectChunkPreload;

  if (window.__UNHANDLED_ERRORS__) {
    window.__UNHANDLED_ERRORS__.forEach(rejectChunkPreload);
  }
        `
          );
          return Template.asString(buf);
        }
      );
    });
  }
}

module.exports = ChunkPreloadPlugin;
