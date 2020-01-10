// @noflow
import App, {assetUrl} from 'fusion-core';

const url = assetUrl('./custom.js.map');

export default (async function() {
  const app = new App('element', el => el);
  app.middleware(async (ctx, next) => {
    const asyncChunk = await import('./async.js');
    const renamedAsyncChunk = await import(
      /* webpackChunkName: "renamed-chunk" */ './async-renamed.js'
    );
    if (ctx.url === '/asset-url') {
      ctx.body = url;
    }
    return next();
  });

  return app;
});
