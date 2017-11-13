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
    const key = ctx === null || ctx === undefined ? __global_key__ : ctx;
    return (
      this.__instances__.get(key) ||
      this.__instances__
        .set(key, this.Service ? new this.Service(ctx) : {})
        .get(key)
    );
  }
}
