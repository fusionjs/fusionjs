/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */
/* eslint-env node */
import {compose} from './compose.js';
import Timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import serverRenderer from './plugins/server-renderer';
import {
  RenderToken,
  ElementToken,
  SSRDeciderToken,
  SSRBodyTemplateToken,
} from './tokens';
import ssrPlugin from './plugins/ssr';
import contextMiddleware from './plugins/server-context.js';
import {appSymbol} from './utils/app-symbol.js';

export default function () {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    constructor(el, render) {
      super(el, render);
      this.endpoints = new Map();
      this._app = new Koa();
      this._app.proxy = true;
      this.middleware(contextMiddleware);
      this.middleware((ctx, next) => {
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
        },
        ssrPlugin(this.endpoints)
      );
    }
    resolve() {
      this.middleware(
        {timing: TimingToken, render: RenderToken},
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
