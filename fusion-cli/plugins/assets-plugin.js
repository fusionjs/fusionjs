//@flow
/* eslint-env node */
const {createPlugin, getEnv} = require('fusion-core');

const path = require('path');
const mount = require('koa-mount');
const serve = require('koa-static');

module.exports = function(dir /* : string */) {
  return createPlugin({
    middleware: () => {
      const {baseAssetPath, env} = getEnv();
      // setting defer here tells the `serve` middleware to `await next` first before
      // setting the response. This allows composition with user middleware
      return mount(
        baseAssetPath,
        serve(path.resolve(dir, `.fusion/dist/${env}/client`), {defer: true})
      );
    },
  });
};
