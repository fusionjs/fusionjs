/* eslint-env node */

const {createPlugin} = require('fusion-core');
const getEnv = require('./environment-variables-plugin');

module.exports = createPlugin({
  middleware: () => {
    const envVars = getEnv();
    return function middleware(ctx, next) {
      const prefix = envVars.prefix;
      // store prefix in context
      ctx.prefix = prefix;

      // enhance ctx.url, sans prefix
      if (ctx.url.indexOf(prefix) === 0 /*found at index 0*/) {
        ctx.url = ctx.url.slice(prefix.length);
      }
      return next();
    };
  },
});
