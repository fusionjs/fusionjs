/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Plugin} from './plugin/index.js';
export default new Plugin({
  Service: class Timing {
    constructor() {
      this.render = deferred();
      this.end = deferred();
      this.downstream = deferred();
      this.upstream = deferred();
    }
  },
  middleware(ctx, next) {
    const {render, end, downstream, upstream} = this.of(ctx);
    ctx.timing = {
      start: now(),
      render: render.promise,
      end: end.promise,
      downstream: downstream.promise,
      upstream: upstream.promise,
    };
    return next().then(() => {
      const endTime = now() - ctx.timing.start;
      end.resolve(endTime);
    });
  },
});

export function now() {
  if (__NODE__) {
    const [seconds, ns] = process.hrtime();
    return Math.round(seconds * 1000 + ns / 1e6);
  } else if (__BROWSER__) {
    if (window.performance && window.performance.now) {
      return Math.round(window.performance.now());
    }
    return Date.now();
  }
}

function deferred() {
  let resolve = null;
  let reject = null;
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
