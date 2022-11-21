/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Context} from './types';

export type MemoizeFn<A> = (ctx: Context) => A;

function Container() {}

export function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A> {
  const memoizeKey = __NODE__ ? Symbol('memoize-key') : new Container();
  return function memoized(ctx: Context): A {
    if (ctx.memoized.has(memoizeKey)) {
      return ctx.memoized.get(memoizeKey) as A;
    }
    const result = fn(ctx);
    ctx.memoized.set(memoizeKey, result);
    return result;
  };
}
