/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

class WebpackState {
  /*:: resolvers: any; */
  /*::  value: any; */

  constructor() {
    this.resolvers = [];
  }

  set(value /*: any */) {
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
