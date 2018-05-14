/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */

import {createPlugin} from 'fusion-core';
import {HttpHandlerToken} from './tokens.js';

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      handler: HttpHandlerToken,
    },

    middleware: deps => {
      const {handler} = deps;
      return (ctx, next) => {
        if (ctx.body) {
          return next();
        }
        return new Promise((resolve, reject) => {
          const oldEnd = ctx.res.end.bind(ctx.res);
          ctx.res.end = (data, encoding, cb) => {
            ctx.respond = false;
            oldEnd(data, encoding, cb);
            return next().then(resolve);
          };
          handler(ctx.req, ctx.res, () => {
            ctx.res.end = oldEnd;
            return next()
              .then(resolve)
              .catch(reject);
          });
        });
      };
    },
  });

export default plugin;
