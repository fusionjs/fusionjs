/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Middleware} from './types.js';

// inline version of koa-compose to get around Rollup/CUP commonjs-related issue
export function compose(middleware: Array<Middleware>): Middleware {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError(
        `Expected middleware function, received: ${typeof fn}`
      );
    }
  }

  return function(context, next) {
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return fn(context, function next() {
          return dispatch(i + 1);
        });
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
