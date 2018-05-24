/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const manifestEmitter = require('./chunk-module-manifest');

/**
 * This webpack loader returns the client chunk ids for a given module filename
 */

module.exports = function(/* content */) {
  /**
   * Not cacheable because the chunk id for a file is dependent
   * on where/how it is imported, not the file contents itself.
   */
  this.cacheable(false);

  const done = this.async();
  const path = this.resourcePath;

  manifestEmitter.get().then(generateSource(path, done));
};

function generateSource(path, done) {
  return function _generateSource(manifest) {
    const result = manifest.get(path);
    if (!result) {
      return void done(new Error(`no result from manifest for ${path}`));
    }

    const chunkIds = Array.from(result);
    if (!chunkIds || !chunkIds.length) {
      return void done(new Error(`unable to parse array from ${result}`));
    }

    let code, err;
    try {
      code = `module.exports = ${JSON.stringify(chunkIds)};`;
    } catch (e) {
      err = e;
    }
    done(err, code);
  };
}
