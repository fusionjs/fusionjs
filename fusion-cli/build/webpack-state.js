/* eslint-env node */

class WebpackState {
  constructor() {
    this.resolvers = [];
  }

  set(value) {
    this.value = value;
    while (this.resolvers.length) {
      const resolve = this.resolvers.shift();
      resolve(value);
    }
  }

  get() {
    return new Promise(resolve => {
      if (typeof this.value !== 'undefined') {
        return resolve(this.value);
      }
      this.resolvers.push(resolve);
    });
  }

  invalidate() {
    this.value = void 0;
  }
}

module.exports = WebpackState;
