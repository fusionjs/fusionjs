/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin} from 'fusion-core';
import type {Fetch} from 'fusion-tokens';

import {verifyMethod, CsrfIgnoreRoutesToken} from './shared';

const enhancer = (oldFetch: Fetch) => {
  return createPlugin({
    deps: {
      ignored: CsrfIgnoreRoutesToken.optional,
    },
    provides: deps => {
      return function serverFetch() {
        return Promise.reject(new Error('Cannot use fetch on the server'));
      };
    },
    middleware: deps => {
      const {ignored = []} = deps;
      const ignoreSet = new Set(ignored);

      return async function csrfMiddleware(ctx, next) {
        if (ctx.path === '/csrf-token' && ctx.method === 'POST') {
          // TODO(#158): Remove this once clients have had the opportunity to upgrade
          ctx.set('x-csrf-token', 'x');
          ctx.status = 200;
          ctx.body = '';
        } else if (verifyMethod(ctx.method) && !ignoreSet.has(ctx.path)) {
          const token = ctx.headers['x-csrf-token'];
          if (!token) {
            const message =
              `Missing csrf token on ${ctx.path}` +
              (__DEV__
                ? ' Ensure you are using `fetch` from `fusion-plugin-csrf-protection-[react].'
                : '');
            ctx.throw(403, message);
          }
        }
        return next();
      };
    },
  });
};

export default enhancer;
