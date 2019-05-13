/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import bodyParser from 'koa-bodyparser';
import assert from 'assert';

import {createPlugin, createToken, html} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {ErrorHandlerPluginType, ErrorHandlerType} from './types.js';

export const ErrorHandlerToken: Token<ErrorHandlerType> = createToken(
  'ErrorHandlerToken'
);

const captureTypes = {
  browser: 'browser',
  request: 'request',
  server: 'server',
};

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {onError: ErrorHandlerToken},
    provides({onError}) {
      assert(typeof onError === 'function', '{onError} must be a function');
      const err = async e => {
        await onError(e, captureTypes.server);
        process.exit(1);
      };
      process.once('uncaughtException', err);
      process.once('unhandledRejection', err);
    },
    middleware({onError}) {
      const parseBody = bodyParser();
      async function middleware(ctx, next) {
        if (ctx.element) {
          // Here, we use GET instead of POST to avoid the need for a CSRF token
          // We also avoid using fusion-plugin-universal-event batching because
          // we want to collect errors even if the vendor bundle fails to load
          // (e.g. due to a network timeout)
          // All errors should be funneled to this handler (e.g. errors in
          // addEventListener handlers, promise rejections, react render errors, etc),
          // ideally by calling `window.onerror` directly with an Error object
          // (which provides more robust stack traces across browsers), or via `throw`
          const script = html`
            <script nonce="${ctx.nonce}">
              onerror = function(m, s, l, c, e) {
                var _e = e || {};
                if (_e.__handled) return;
                var error = {};
                Object.getOwnPropertyNames(_e).forEach(function(key) {
                  error[key] = e[key];
                });
                var x = new XMLHttpRequest();
                x.open('POST', '${ctx.prefix}/_errors');
                x.setRequestHeader('Content-Type', 'application/json');
                x.send(
                  JSON.stringify({
                    message: m,
                    source: s,
                    line: l,
                    col: c,
                    error: error,
                  })
                );
                _e.__handled = true;
              };
            </script>
          `;
          ctx.template.head.unshift(script);
        } else if (ctx.path === '/_errors') {
          await parseBody(ctx, () => Promise.resolve());
          // $FlowFixMe
          await onError(ctx.request.body, captureTypes.browser, ctx);
          ctx.body = {ok: 1};
        }
        try {
          await next();
        } catch (e) {
          // Don't await onError here because we want to send a response as soon as possible to the user
          onError(e, captureTypes.request, ctx);
          throw e;
        }
      }
      return middleware;
    },
  });

export default ((plugin: any): ErrorHandlerPluginType);
