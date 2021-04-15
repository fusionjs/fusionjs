// @noflow
import App from 'fusion-core';
import {assetUrl} from 'fusion-core';
import jsonData from './static/test.json';

import serverAsset from './server-asset.js';

const hoistedUrl = assetUrl('./static/test.css');
if (typeof window !== 'undefined') {
  window.__hoistedUrl__ = hoistedUrl;
}

export default (async function() {
  const app = new App('element', el => el);
  __NODE__ &&
  app.middleware(async (ctx, next) => {
    if (__NODE__) {
      await next();
      if (ctx.method === 'GET' && ctx.status === 404) {
        ctx.status = 200;
        ctx.body = 'hi from fallback middleware';
      }
    }
    return;
  });

  __BROWSER__ && console.log('Dirname is', __dirname);
  __BROWSER__ && console.log('Filename is', __filename);
  return app;
});
