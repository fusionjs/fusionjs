const __global_key__ = {};

export default class Plugin {
  constructor({middleware = (ctx, next) => next(), Service}) {
    this.middleware = middleware;
    this.Service = Service || class {};
  }
  of(ctx) {
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
      this.__values__.push(this.Service ? new this.Service(ctx) : {});
      return this.__values__[this.__values__.length - 1];
    }
    return this.__values__[i];
  }
}
