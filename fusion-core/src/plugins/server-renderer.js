import {now} from './timing';

export default function getRendererPlugin({render, timing}) {
  return async function renderer(ctx, next) {
    const timer = timing.from(ctx);
    timer.downstream.resolve(now() - timer.start);

    let renderTime = 0;
    if (ctx.element) {
      const renderStart = now();
      ctx.rendered = await render(ctx.element);
      renderTime = now() - renderStart;
    }

    timer.upstreamStart = now();
    await next();

    if (ctx.element) {
      timer.render.resolve(renderTime);
    }
  };
}
