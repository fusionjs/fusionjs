// @flow

import type {Context} from '../../Context';

type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<void> | void;

type PluginParams<T> = {
  middleware: Middleware,
  Service: Class<T>,
};

const __global_key__ = Object.freeze({});
const emptyObject = Object.freeze({});

export default class Plugin<T: *> {
  middleware: Middleware;
  Service: ?Class<T>;
  __keys__: Array<{||} | Context>;
  __values__: Array<{||} | T>;

  constructor(args: PluginParams<T>) {
    this.middleware =
      args.middleware || ((ctx: Context, next: () => Promise<void>) => next());
    this.Service = args.Service;
  }
  of(ctx: ?{||} | Context): {} | T {
    if (!this.hasOwnProperty('__keys__')) {
      this.__keys__ = [];
      this.__values__ = [];
    }
    if (ctx == null) ctx = __global_key__;
    if (typeof ctx !== 'object' && typeof ctx !== 'function') {
      throw new TypeError('Invalid key');
    }

    const i = this.__keys__.indexOf(ctx);
    if (i < 0) {
      this.__keys__.push(ctx);

      let val: {||} | T = emptyObject;
      if (this.Service) {
        val = new this.Service(ctx);
      }
      this.__values__.push(val);
      return this.__values__[this.__values__.length - 1];
    }
    return this.__values__[i];
  }
}
