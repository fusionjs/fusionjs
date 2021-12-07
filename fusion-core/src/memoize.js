/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

function Container() {}

export function memoize(fn) {
  const memoizeKey = __NODE__ ? Symbol('memoize-key') : new Container();
  return function memoized(ctx) {
    if (ctx.memoized.has(memoizeKey)) {
      return ctx.memoized.get(memoizeKey);
    }
    const result = fn(ctx);
    ctx.memoized.set(memoizeKey, result);
    return result;
  };
}
