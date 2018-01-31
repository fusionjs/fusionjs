/* @flow */
/* eslint-env node */
import {compose} from './compose.js';
import Timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import serverRenderer from './plugins/server-renderer';
import {RenderToken, ElementToken} from './tokens';
import ssrPlugin from './plugins/ssr';

export default function(): Class<FusionApp> {
  const Koa = require('koa');

  return class ServerApp extends BaseApp {
    _app: Koa;
    constructor(el, render) {
      super(el, render);
      this._app = new Koa();
      this.register(TimingToken, Timing);
      this.middleware({element: ElementToken}, ssrPlugin);
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
      return this._app.callback();
    }
  };
}
