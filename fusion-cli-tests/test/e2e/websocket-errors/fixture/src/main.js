// @noflow
import App from 'fusion-core';

export default async function () {
  const app = new App('test', (el) => el);
  if (__NODE__) {
    app.middleware((ctx, next) => {
      if (ctx.url === '/health') {
        ctx.body = 'OK';
      }
      return next();
    });
  }
  return app;
}
