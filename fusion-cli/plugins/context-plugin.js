/* eslint-env node */

/*
This is where new ctx properties should be initialized
*/

const envVarsPlugin = require('./environment-variables-plugin');
const compilationMetaDataPlugin = require('./compilation-metadata-plugin');
const uuidv4 = require('uuid/v4');
const UAParser = require('ua-parser-js');

module.exports = function() {
  const envVars = envVarsPlugin().of();
  const compilationMetaData = compilationMetaDataPlugin().of();
  return function middleware(ctx, next) {
    // env vars
    ctx.rootDir = envVars.rootDir;
    ctx.env = envVars.env;
    ctx.prefix = envVars.prefix;
    ctx.assetPath = envVars.assetPath;

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
};
