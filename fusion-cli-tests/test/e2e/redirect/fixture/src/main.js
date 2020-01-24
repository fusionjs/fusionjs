// @noflow
import App from 'fusion-core';

export default async function() {
  const app = new App('element', el => el);
  if (__NODE__) {
    app.middleware((ctx, next) => {
      if (ctx.path === '/redirect') {
        ctx.redirect('/test');
      } else if (ctx.path === '/test') {
        ctx.body = 'OK';
      }
      return next();
    });
  }
  return app;
}
