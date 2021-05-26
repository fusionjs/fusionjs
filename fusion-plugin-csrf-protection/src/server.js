/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin, type FusionPlugin} from 'fusion-core';
import type {Fetch} from 'fusion-tokens';

import {verifyMethod, CsrfIgnoreRoutesToken} from './shared';

type PluginDepsType = {
  ignored: typeof CsrfIgnoreRoutesToken.optional,
};

const enhancer = (oldFetch: Fetch): FusionPlugin<PluginDepsType, Fetch> => {
  return createPlugin({
    deps: {
      ignored: CsrfIgnoreRoutesToken.optional,
    },
    provides: deps => {
      // Pass through the old implementation
      return oldFetch;
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
                ? ' Ensure you are using `fetch` enhanced by `fusion-plugin-csrf-protection`.'
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
