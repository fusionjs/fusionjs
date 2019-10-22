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

import {createPlugin, createToken, html, dangerouslySetHTML} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {
  ErrorHandlerPluginType,
  ErrorHandlerType,
  ErrorHandlingTransformType,
} from './types.js';

export const ErrorHandlerToken: Token<ErrorHandlerType> = createToken(
  'ErrorHandlerToken'
);

export const ErrorHandlingTransformToken: Token<ErrorHandlingTransformType> = createToken(
  'ErrorHandlingTransformToken'
);

const captureTypes = {
  browser: 'browser',
  request: 'request',
  server: 'server',
};

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      onError: ErrorHandlerToken,
      errorHandlingTransform: ErrorHandlingTransformToken.optional,
    },
    provides({onError}) {
      assert(typeof onError === 'function', '{onError} must be a function');
      // It's possible to call reject with a non-error
      const err = async (e: mixed) => {
        if (e instanceof Error) {
          await onError(e, captureTypes.server);
        } else {
          await onError(new Error(String(e)), captureTypes.server);
        }
        process.exit(1);
      };
      process.once('uncaughtException', err);
      process.once('unhandledRejection', err);
    },
    middleware({onError, errorHandlingTransform}) {
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
          //
          // Specific error message strings should never be sent more than 3 times to avoid
          // a single user spamming the client alert topic
          const script = html`
            <script nonce="${ctx.nonce}">
              const messageCounts = {};
              let transformFailed = false;

              const ErrorHandlingPlugin = {
                parseError(e) {
                  var _e = e || {};
                  var error = {};
                  Object.getOwnPropertyNames(_e).forEach(function(key) {
                    error[key] = e[key];
                  });
                  return error;
                },
                onError() {
                  const [
                    errorHandlingTransformError,
                    m,
                    s,
                    l,
                    c,
                    e,
                    ...data
                  ] = !transformFailed
                    ? ErrorHandlingPlugin.tryTransform(...arguments)
                    : [null, ...arguments];
                  var _e = e || {};
                  messageCounts[m] = (messageCounts[m] || 0) + 1;
                  if (_e.__handled || messageCounts[m] > 3) return;
                  var error = ErrorHandlingPlugin.parseError(_e);
                  ErrorHandlingPlugin.sendError(
                    JSON.stringify({
                      message: m,
                      source: s,
                      line: l,
                      col: c,
                      error: error,
                      ...(data.length !== 0 ? {data} : {}),
                    })
                  );
                  if (errorHandlingTransformError != null) {
                    transformFailed = true;
                    ErrorHandlingPlugin.sendError(
                      JSON.stringify({
                        message: errorHandlingTransformError.message,
                        source: errorHandlingTransformError.stack,
                        line: 0,
                        col: 0,
                        error: ErrorHandlingPlugin.parseError(
                          errorHandlingTransformError
                        ),
                      })
                    );
                    throw errorHandlingTransformError;
                  }
                  _e.__handled = true;
                },
                tryTransform() {
                  try {
                    const transform = ${dangerouslySetHTML(
                      errorHandlingTransform != null
                        ? errorHandlingTransform.toString()
                        : 'null'
                    )};
                    return [
                      null,
                      ...(transform != null
                        ? transform(...arguments)
                        : arguments),
                    ];
                  } catch (transformError) {
                    return [transformError, ...arguments];
                  }
                },
                sendError(message) {
                  var x = new XMLHttpRequest();
                  x.open('POST', '${ctx.prefix}/_errors');
                  x.setRequestHeader('Content-Type', 'application/json');
                  x.send(message);
                },
              };
              onerror = ErrorHandlingPlugin.onError;
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
