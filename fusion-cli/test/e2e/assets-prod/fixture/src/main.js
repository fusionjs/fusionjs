// @noflow
import App, {assetUrl} from 'fusion-core';

const url = assetUrl('./custom.js.map');

export default (async function() {
  const app = new App('element', el => el);
  app.middleware((ctx, next) => {
    if (ctx.url === '/asset-url') {
      ctx.body = url;
    }
    return next();
  });

  return app;
});
