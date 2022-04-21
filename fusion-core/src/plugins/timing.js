/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */
import {createPlugin} from '../create-plugin';
import {memoize} from '../memoize';
import {createToken} from '../create-token';
import {now} from '../utils/now.js';

class Timing {
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

  markPrepass(pendingSize) {
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

const timing = {
  from: memoize(() => new Timing()),
};

export const TimingToken = createToken('TimingToken');

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

export default createPlugin({
  provides: () => timing,
  middleware: () => middleware,
});

function deferred() {
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
