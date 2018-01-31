/* @flow */
type MemoizeFn<A> = (ctx: Context) => A;

function Container() {}

export function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A> {
  const memoizeKey = __NODE__ ? Symbol('memoize-key') : new Container();
  return function memoized(ctx: Context) {
    if (ctx.memoized.has(memoizeKey)) {
      return ctx.memoized.get(memoizeKey);
    }
    const result = fn(ctx);
    ctx.memoized.set(memoizeKey, result);
    return result;
  };
}
