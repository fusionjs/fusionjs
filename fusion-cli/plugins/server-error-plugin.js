/* eslint-env node */

const renderError = require('../build/server-error').renderError;
const {createPlugin} = require('fusion-core');

module.exports = createPlugin({
  middleware: () =>
    async function middleware(ctx, next) {
      try {
        await next();
      } catch (err) {
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = renderError(err);
      }
    },
});
