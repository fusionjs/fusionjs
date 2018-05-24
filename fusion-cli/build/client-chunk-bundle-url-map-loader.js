/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Probably have to do this via a loader configuration webpack plugin
const clientChunkBundleUrlMap = require('./client-chunk-bundle-url-map');

module.exports = function(/* content */) {
  // Maybe split this loader in two and cache one of them.
  // Additionally, it'd be nice to cache the whole thing if our manifest has not changed at all
  this.cacheable(false);

  const done = this.async();
  clientChunkBundleUrlMap.get().then(data => {
    done(null, generateSource(data.manifest));
  });
};

function generateSource(manifest) {
  return `module.exports = new Map(
    ${JSON.stringify(
      Array.from(manifest.entries()).map(entry => {
        entry[1] = Array.from(entry[1].entries());
        return entry;
      })
    )}.map(entry => { //[number, Map<string,string>]
      entry[1] = new Map(
        entry[1].map(group => {
          group[1] = __webpack_public_path__ + group[1];
          return group;
        })
      );
      return entry;
    })
  );`;
}
