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

class ClientChunkBundleUrlMapPlugin {
  /*:: expectedGroupIds: any; */
  /*:: groupId: any; */

  constructor(expectedGroupIds /*: any */, groupId /*: any */) {
    this.expectedGroupIds = expectedGroupIds;
    this.groupId = groupId;
  }
  apply(compiler /*: any */) {
    const {expectedGroupIds, groupId} = this;

    compiler.hooks.invalid.tap('ClientChunkBundleUrlMapPlugin', () => {
      clientChunkBundleUrlMap.invalidate();
    });

    compiler.hooks.compilation.tap(
      'ClientChunkBundleUrlMapPlugin',
      compilation => {
        compilation.hooks.afterOptimizeChunkAssets.tap(
          'ClientChunkBundleUrlMapPlugin',
          chunks => {
            const {manifest = new Map(), groups = new Set(), resolve = null} =
              clientChunkBundleUrlMap.value || {};
            groups.add(groupId);
            chunks.forEach(chunk => {
              const chunkGroups = manifest.get(chunk.id) || new Map();
              const [filename] = chunk.files;
              chunkGroups.set(groupId, filename);
              manifest.set(chunk.id, chunkGroups);
            });
            const finalValue = {manifest, groups, resolve};
            clientChunkBundleUrlMap.value = finalValue;

            // wait until all assets are built before letting the loader load
            if (groups.size === expectedGroupIds.length) {
              clientChunkBundleUrlMap.set(finalValue);
            }
          }
        );
      }
    );
  }
}

module.exports = ClientChunkBundleUrlMapPlugin;
