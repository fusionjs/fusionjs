// @noflow
import App, {assetUrl} from 'fusion-core';

const url = assetUrl('./custom.js.map');

export default (async function() {
  const app = new App('element', el => el);
  app.middleware(async (ctx, next) => {
    // Force json into its own chunk
    const json = await import(
     /* webpackChunkName: "json-chunk" */ './json.json'
    );
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
