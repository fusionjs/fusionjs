const __global_key__ = {};

export default class Plugin {
  constructor({middleware = (ctx, next) => next(), Service}) {
    this.middleware = middleware;
    this.Service = Service || class {};
  }
  of(ctx) {
    if (!this.hasOwnProperty('__instances__')) {
      this.__instances__ = new WeakMap();
    }
    if (ctx == null) ctx = __global_key__;
    return (
      this.__instances__.get(ctx) ||
      this.__instances__
        .set(ctx, this.Service ? new this.Service(ctx) : {})
        .get(ctx)
    );
  }
}
