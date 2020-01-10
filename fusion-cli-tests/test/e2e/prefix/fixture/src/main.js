// @noflow
import App, {createPlugin, RoutePrefixToken} from 'fusion-core';

export default async function() {
  const app = new App('element', el => el);
  app.middleware((ctx, next) => {
    if (ctx.url === '/' && ctx.path === '/') {
      ctx.body = 'ROOT REQUEST';
    } else if (ctx.url === '/test' && ctx.path === '/test') {
      ctx.body = 'TEST REQUEST';
    }
    return next();
  });
  app.register(
    createPlugin({
      deps: {
        routePrefix: RoutePrefixToken,
      },
      middleware({routePrefix}) {
        return (ctx, next) => {
          if (ctx.url === '/server-token') {
            ctx.body = routePrefix;
            return next();
          }
          if (__BROWSER__) {
            window.__client_route_prefix_token_value__ = routePrefix;
          }
          return next();
        };
      },
    })
  );
  return app;
}
