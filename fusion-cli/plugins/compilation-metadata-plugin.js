/* eslint-env node */

/*
This is where webpack-related things should be defined
*/

const path = require('path');
const {Plugin} = require('fusion-core');
const envVarsPlugin = require('./environment-variables-plugin');

//custom loaders: see build/compiler.js
const chunkUrlMap = require('__SECRET_BUNDLE_MAP_LOADER__!');
const syncChunks = require('__SECRET_SYNC_CHUNK_IDS_LOADER__!');

module.exports = function() {
  const {prefix, assetPath, cdnUrl} = envVarsPlugin().of();
  return new Plugin({
    Service: class CompilationMetaData {
      constructor() {
        this.syncChunks = syncChunks;
        this.preloadChunks = [];
        this.chunkUrlMap = chunkUrlMap;
        this.webpackPublicPath = cdnUrl || path.join(prefix, assetPath);
      }
    },
  });
};
