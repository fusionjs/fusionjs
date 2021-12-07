/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {now} from './timing';

export default function getRendererPlugin({render, timing}) {
  return async function renderer(ctx, next) {
    const timer = timing.from(ctx);
    timer.downstream.resolve(now() - timer.start);

    let renderTime = null;
    if (ctx.element && !ctx.body && ctx.respond !== false) {
      const renderStart = now();
      ctx.rendered = await render(ctx.element, ctx);
      renderTime = now() - renderStart;
    }

    timer.upstreamStart = now();
    await next();

    if (ctx.element && typeof renderTime === 'number') {
      timer.render.resolve(renderTime);
    }
  };
}
