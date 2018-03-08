/* eslint-env node */

/*
This is where new ctx properties should be initialized
*/

const getCompilationMetaData = require('../get-compilation-metadata.js');
const {createPlugin} = require('fusion-core');

module.exports = createPlugin({
  middleware: () => {
    const compilationMetaData = getCompilationMetaData();
    return function middleware(ctx, next) {
      // webpack-related things
      ctx.syncChunks = compilationMetaData.syncChunks;
      ctx.chunkUrlMap = compilationMetaData.chunkUrlMap;

      return next();
    };
  },
});
