/* @flow */
/* eslint-env node */
import {compose} from './compose.js';
import Timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import serverRenderer from './plugins/server-renderer';
import {RenderToken, ElementToken, SSRDeciderToken} from './tokens';
import ssrPlugin from './plugins/ssr';
import contextMiddleware from './plugins/server-context.js';

export default function(): typeof BaseApp {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    _app: Koa;
    constructor(el, render) {
      super(el, render);
      this._app = new Koa();
      this.middleware(contextMiddleware);
      this.register(TimingToken, Timing);
      this.middleware(
        {element: ElementToken, ssrDecider: SSRDeciderToken},
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
      // $FlowFixMe
      this._app.use(compose(this.plugins));
      // $FlowFixMe
      return this._app.callback();
    }
  };
}
