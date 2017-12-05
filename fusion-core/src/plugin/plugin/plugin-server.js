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
  Service: Class<T>;
  __instances__: WeakMap<{||} | Context, {||} | T>;

  constructor(args: PluginParams<T>) {
    // constructor({middleware = (ctx, next) => next(), Service}) {
    this.middleware =
      args.middleware || ((ctx: Context, next: () => Promise<void>) => next());
    this.Service = args.Service;
  }
  of(ctx: ?{||} | Context) {
    if (!this.hasOwnProperty('__instances__')) {
      this.__instances__ = new WeakMap();
    }
    const key = ctx === null || ctx === undefined ? __global_key__ : ctx;
    return (
      this.__instances__.get(key) ||
      this.__instances__
        .set(key, this.Service ? new this.Service(ctx) : emptyObject)
        .get(key)
    );
  }
}
