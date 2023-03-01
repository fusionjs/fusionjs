/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* eslint-env node */
import {compose} from './compose';
import Timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import serverRenderer from './plugins/server-renderer';
import {
  RenderToken,
  ElementToken,
  SSRDeciderToken,
  SSRBodyTemplateToken,
  SSRShellTemplateToken,
  ErrorHandlerToken,
} from './tokens';
import ssrPlugin from './plugins/ssr';
import contextMiddleware from './plugins/server-context';
import {appSymbol} from './utils/app-symbol';
import {Middleware} from './types';
import {createPlugin} from './create-plugin';

export default function () {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    _app: import('koa');
    endpoints: Map<string, Middleware>;
    constructor(el: any, render: any) {
      super(el, render);
      this.endpoints = new Map();
      this._app = new Koa();
      this._app.proxy = true;
      this.middleware(contextMiddleware);
      this.middleware((ctx, next) => {
        // @ts-expect-error todo(flow->ts) why we need to use symbol for this? why not regular property?
        ctx[appSymbol] = this;
        return next();
      });
      this.register(TimingToken, Timing);
      this.middleware((ctx, next) => {
        for (const [endpointPath, handler] of this.endpoints) {
          if (ctx.path === endpointPath) {
            return handler(ctx, next);
          }
        }
        return next();
      });
      this.middleware(
        {
          element: ElementToken,
          ssrDecider: SSRDeciderToken,
          ssrBodyTemplate: SSRBodyTemplateToken.optional,
          ssrShellTemplate: SSRShellTemplateToken.optional,
        },
        ssrPlugin(this.endpoints)
      );
      this.register(
        createPlugin({
          deps: {errorHandler: ErrorHandlerToken.optional},
          provides: ({errorHandler}) => {
            if (!errorHandler) {
              return;
            }
            this._app.on('error', (err, ctx) => {
              errorHandler(err, 'request', ctx);
            });
          },
        })
      );
    }
    resolve() {
      this.middleware(
        {
          timing: TimingToken,
          render: RenderToken,
          ssrDecider: SSRDeciderToken,
        },
        serverRenderer(this)
      );
      return super.resolve();
    }
    callback() {
      this.resolve();
      this._app.use(compose(this.plugins));
      return this._app.callback();
    }
  };
}
