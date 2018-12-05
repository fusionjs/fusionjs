/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {createPlugin} from '../create-plugin';
import {memoize} from '../memoize';
import {createToken} from '../create-token';
import type {Token} from '../types.js';

type Deferred<T> = {
  promise: Promise<T>,
  resolve: (result: T) => void,
  reject: (error: Error) => void,
};

class Timing {
  start: number;
  render: Deferred<number>;
  end: Deferred<number>;
  downstream: Deferred<number>;
  upstream: Deferred<number>;
  upstreamStart: number;
  constructor() {
    this.start = now();
    this.render = deferred();
    this.end = deferred();
    this.downstream = deferred();
    this.upstream = deferred();
    this.upstreamStart = -1;
  }
}
type TimingPlugin = {
  from(ctx: Object): Timing,
};

const timing: TimingPlugin = {
  from: memoize(() => new Timing()),
};

export const TimingToken: Token<TimingPlugin> = createToken('TimingToken');

function middleware(ctx, next) {
  ctx.memoized = new Map();
  const {start, render, end, downstream, upstream} = timing.from(ctx);
  ctx.timing = {
    start,
    render: render.promise,
    end: end.promise,
    downstream: downstream.promise,
    upstream: upstream.promise,
  };
  return next()
    .then(() => {
      const upstreamTime = now() - timing.from(ctx).upstreamStart;
      upstream.resolve(upstreamTime);
      const endTime = now() - ctx.timing.start;
      end.resolve(endTime);
    })
    .catch(e => {
      // currently we only resolve upstream and downstream when the request does not error
      // we should however always resolve the request end timing
      if (e && e.status) {
        // this ensures any logging / metrics based on ctx.status will recieve the correct status code
        ctx.status = e.status;
      }
      const endTime = now() - ctx.timing.start;
      end.resolve(endTime);
      throw e;
    });
}

export default createPlugin<{}, typeof timing>({
  provides: () => timing,
  middleware: () => middleware,
});

export function now(): number {
  if (__NODE__) {
    const [seconds, ns] = process.hrtime();
    return Math.round(seconds * 1000 + ns / 1e6);
  } else {
    // eslint-disable-next-line cup/no-undef
    if (window.performance && window.performance.now) {
      // eslint-disable-next-line cup/no-undef
      return Math.round(window.performance.now());
    }
    return Date.now();
  }
}

function deferred<T>(): Deferred<T> {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}
