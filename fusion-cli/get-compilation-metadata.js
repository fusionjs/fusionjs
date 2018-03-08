/* eslint-env node */

/*
This is where webpack-related things should be defined
*/

// custom loaders: see build/compiler.js
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const chunkUrlMap = require('__SECRET_BUNDLE_MAP_LOADER__!');
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const syncChunks = require('__SECRET_SYNC_CHUNK_IDS_LOADER__!');

module.exports = () => {
  return {
    syncChunks,
    chunkUrlMap,
  };
};
