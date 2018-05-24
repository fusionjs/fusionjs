/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
