import App from 'fusion-core';
import {assetUrl} from 'fusion-core';
export default async function() {
  const app = new App('element', el => el);
  __NODE__ && app.plugin(() => (ctx, next) => {
    if (ctx.url.startsWith('/_static')) {
      ctx.set('x-test', 'test');
    } else if (ctx.url === '/test') {
      ctx.body = assetUrl('./static/test.css');
    } else if (ctx.url === '/dirname') {
      ctx.body = __dirname;
    } else if (ctx.url === '/filename') {
      ctx.body = __filename;
    }
    
    __BROWSER__ && console.log('Dirname is', __dirname);
    __BROWSER__ && console.log('Filename is', __filename);
    return next();
  });
  return app;
}