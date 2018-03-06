import App from 'fusion-core';
import fs from 'fs';

export default async function() {
  const app = new App('element', el => el);
  __NODE__ &&
    app.middleware((ctx, next) => {
      if (ctx.url === '/fs') {
        ctx.body = Object.keys(fs);
      }
      return next();
    });
  __BROWSER__ &&
    app.middleware((ctx, next) => {
      console.log(Object.keys(fs));
    });
  return app;
}
