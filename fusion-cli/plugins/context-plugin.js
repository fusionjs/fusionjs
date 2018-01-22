/* eslint-env node */

/*
This is where new ctx properties should be initialized
*/

const getEnv = require('./environment-variables-plugin');
const getCompilationMetaData = require('./compilation-metadata-plugin');
const {createPlugin} = require('fusion-core');
const uuidv4 = require('uuid/v4');
const UAParser = require('ua-parser-js');

module.exports = createPlugin({
  middleware: () => {
    const envVars = getEnv();
    const compilationMetaData = getCompilationMetaData();
    return function middleware(ctx, next) {
      // env vars
      ctx.rootDir = envVars.rootDir;
      ctx.env = envVars.env;
      ctx.prefix = envVars.prefix;
      ctx.assetPath = envVars.assetPath;
      ctx.cdnUrl = envVars.cdnUrl;

      // webpack-related things
      ctx.syncChunks = compilationMetaData.syncChunks;
      ctx.preloadChunks = [];
      ctx.chunkUrlMap = compilationMetaData.chunkUrlMap;
      ctx.webpackPublicPath = compilationMetaData.webpackPublicPath;

      // fusion-specific things
      ctx.nonce = uuidv4();
      ctx.useragent = new UAParser(ctx.headers['user-agent']).getResult();
      ctx.element = null;
      ctx.rendered = null;

      return next();
    };
  },
});
