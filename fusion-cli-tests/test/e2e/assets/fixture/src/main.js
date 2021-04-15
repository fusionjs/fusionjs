// @noflow
import App, {assetUrl} from 'fusion-core';
import testJson from './static/test.json';
import {RouteTagsToken} from 'fusion-core';

import serverAsset from './server-asset.js';

const hoistedUrl = assetUrl('./static/test.css');
if (typeof window !== 'undefined') {
  window.__hoistedUrl__ = hoistedUrl;
  window.__hoistedDirname__ = __dirname;
  window.__hoistedFilename__ = __filename;
}

export default async function() {
  const app = new App('element', el => el);
  __NODE__ &&
    app.middleware(
      {RouteTags: RouteTagsToken},
      ({RouteTags}) => async (ctx, next) => {
        if (ctx.url.startsWith('/_static')) {
          ctx.set('x-test', 'test');
        } else if (ctx.url === '/test') {
          ctx.body = assetUrl('./static/test.css');
        } else if (ctx.url === '/dirname') {
          ctx.body = __dirname;
        } else if (ctx.url === '/filename') {
          ctx.body = __filename;
        } else if (ctx.url === '/hoisted') {
          ctx.body = hoistedUrl;
        } else if (ctx.url === '/json') {
          ctx.body = assetUrl('./static/test.json');
        } else if (ctx.url === '/json-import') {
          ctx.body = testJson.key;
        } else if (ctx.url === '/server-asset') {
          ctx.body = serverAsset;
        }
        await next();
        ctx.set('x-route-name', RouteTags.from(ctx).name);
      }
    );
  return app;
};
