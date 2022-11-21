/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {createPlugin} from '../create-plugin';
import {memoize} from '../memoize';
import {createToken} from '../create-token';
import {now} from '../utils/now';
import type {
  Deferred,
  MiddlewareTiming,
  PrepassTiming,
  TimingInterface,
  TimingPlugin,
  Token,
} from '../types';

class Timing implements TimingInterface {
  start: number;
  render: Deferred<number>;
  end: Deferred<number>;
  downstream: Deferred<number>;
  upstream: Deferred<number>;
  upstreamStart: number;
  middleware: Array<MiddlewareTiming>;
  prepass: Array<PrepassTiming>;
  prepassMarked: boolean;
  prepassStart: number;

  constructor() {
    this.start = now();
    this.render = deferred();
    this.end = deferred();
    this.downstream = deferred();
    this.upstream = deferred();
    this.upstreamStart = -1;
    this.middleware = [];
    this.prepass = [];
    this.prepassMarked = false;
    this.prepassStart = -1;
  }

  markPrepass(pendingSize?: number) {
    if (!this.prepassMarked) {
      this.prepassMarked = true;
      this.prepassStart = now();
    } else {
      this.prepass.push({
        duration: now() - this.prepassStart,
        pendingSize: pendingSize || 0,
      });
      this.prepassMarked = false;
      this.prepassStart = -1;
    }
  }
}

const timing: TimingPlugin = {
  from: memoize(() => new Timing()),
};

export const TimingToken: Token<TimingPlugin> = createToken('TimingToken');

function middleware(ctx, next) {
  ctx.memoized = new Map();
  const {
    start,
    render,
    end,
    downstream,
    upstream,
    middleware,
    prepass,
    markPrepass,
  } = timing.from(ctx);
  ctx.timing = {
    start,
    render: render.promise,
    end: end.promise,
    downstream: downstream.promise,
    upstream: upstream.promise,
    middleware,
    prepass,
    markPrepass,
  };
  return next()
    .then(() => {
      const upstreamTime = now() - timing.from(ctx).upstreamStart;
      upstream.resolve(upstreamTime);
      const endTime = now() - ctx.timing.start;
      end.resolve(endTime);
    })
    .catch((e) => {
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

function deferred<T>(): Deferred<T> {
  let resolve = (result: T) => {};
  let reject = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}
