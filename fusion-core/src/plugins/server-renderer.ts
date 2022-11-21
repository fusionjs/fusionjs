/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {now} from '../utils/now';
import type {
  Context,
  RenderType,
  SSRDecider as SSRDeciderService,
  TimingPlugin,
} from '../types';

export default function createServerRenderPlugin(app) {
  return function serverRenderPlugin({
    render,
    timing,
    ssrDecider,
  }: {
    render: RenderType;
    timing: TimingPlugin;
    ssrDecider: SSRDeciderService;
  }) {
    return async function renderer(ctx: Context, next: () => Promise<void>) {
      app._setRef();
      app.renderSetupCtx = ctx;
      // Element wrappers should be added in *reverse* topological order so that
      // the resulting element tree is in topological order during renders.
      // For example, if plugin B depends on plugin A, the tree should be:
      // <AProvider>
      //   <BProvider>{root}</BProvider>
      // </APRovider>
      // In this case, B provider can depend on the context of A provider.
      for (var i = app.renderSetup.length - 1; i >= 0; i--) {
        const wrapper = app.renderSetup[i];
        const result = wrapper(ctx.element);
        if (result !== void 0) {
          ctx.element = result;
        }
      }
      app.renderSetupCtx = void 0;
      app._clearRef();

      const timer = timing.from(ctx);
      timer.downstream.resolve(now() - timer.start);

      let renderTime = null;
      if (ctx.element && !ctx.body && ctx.respond !== false) {
        app._setRef();
        app.renderCtx = ctx;
        const renderStart = now();
        ctx.rendered = await render(ctx.element, ctx);
        renderTime = now() - renderStart;
        app.renderCtx = void 0;
        app._clearRef();
      }

      // For non-streaming, run post prepare effects here
      // For streaming they are run on prepare boundary drop
      if (ssrDecider(ctx) === true) {
        app._setRef();
        app.postPrepareEffectCtx = ctx;
        for (const effect of ctx.postPrepareEffects) {
          effect();
        }
        app.postPrepareEffectCtx = void 0;
        app._clearRef();
      }

      timer.upstreamStart = now();
      await next();

      if (ctx.element && typeof renderTime === 'number') {
        timer.render.resolve(renderTime);
      }
    };
  };
}
