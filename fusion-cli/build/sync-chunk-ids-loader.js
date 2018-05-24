/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const syncChunkIds = require('./sync-chunk-ids');

module.exports = function(/* content */) {
  // Maybe split this loader in two and cache one of them.
  // Additionally, it'd be nice to cache the whole thing if our manifest has not changed at all
  this.cacheable(false);

  const done = this.async();
  syncChunkIds.get().then(manifest => {
    done(null, generateSource(manifest));
  });
};

function generateSource(manifest) {
  return `module.exports = ${JSON.stringify(manifest)};`;
}
