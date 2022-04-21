/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

export default function createClientRenderPlugin(app) {
  return function clientRenderPlugin({render}) {
    return function renderer(ctx, next) {
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

      const rendered = render(ctx.element, ctx);
      if (rendered instanceof Promise) {
        return rendered.then((r) => {
          ctx.rendered = r;
          return next();
        });
      } else {
        ctx.rendered = rendered;
        return next();
      }
    };
  };
}
