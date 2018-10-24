/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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

export default function(): typeof BaseApp {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    _app: Koa;
    constructor(el, render) {
      super(el, render);
      this._app = new Koa();
      this._app.proxy = true;
      this.middleware(contextMiddleware);
      this.register(TimingToken, Timing);
      this.middleware(
        {
          element: ElementToken,
          ssrDecider: SSRDeciderToken,
          ssrBodyTemplate: SSRBodyTemplateToken.optional,
        },
        ssrPlugin
      );
    }
    resolve() {
      this.middleware(
        {timing: TimingToken, render: RenderToken},
        serverRenderer
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
