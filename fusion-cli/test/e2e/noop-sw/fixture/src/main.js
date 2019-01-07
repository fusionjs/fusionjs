// @flow
import App from 'fusion-core';

// $FlowFixMe
import {swTemplate} from 'fusion-cli/sw';

export default async function() {
  const sw = swTemplate({foo: 'bar'});
  const app = new App('element', el => el);
  app.middleware((ctx, next) => {
    if (ctx.url === '/sw.js') {
      ctx.body = sw;
    }
    return next();
  });
  return app;
}
