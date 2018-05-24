/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*
This is where webpack-related things should be defined
*/

// custom loaders: see build/compiler.js
// $FlowFixMe
const chunkUrlMap = require('__SECRET_BUNDLE_MAP_LOADER__!'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
// $FlowFixMe
const syncChunks = require('__SECRET_SYNC_CHUNK_IDS_LOADER__!'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

module.exports = () => {
  return {
    syncChunks,
    chunkUrlMap,
  };
};
