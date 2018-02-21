import App from 'fusion-core';

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
  return app;
}
