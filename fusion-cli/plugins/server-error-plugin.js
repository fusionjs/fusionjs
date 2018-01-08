/* eslint-env node */

const renderError = require('../build/server-error').renderError;

module.exports = function() {
  return async function middleware(ctx, next) {
    try {
      await next();
    } catch (err) {
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = renderError(err);
    }
  };
};
