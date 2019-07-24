// @noflow
import App from 'fusion-core';

export default (async function() {
  const app = new App('element', el => el);
  const aPromise = import('./test-a.js');
  const bPromise = import('./test-b.js');
  const cPromise = import('./test.js');
  app.middleware((ctx, next) => {
    if (ctx.path === '/test-a') {
      ctx.body = aPromise.__CHUNK_IDS;
    } else if (ctx.path === '/test-b') {
      ctx.body = bPromise.__CHUNK_IDS;
    } else if (ctx.path === '/test') {
      ctx.body = cPromise.__CHUNK_IDS;
    }
  });
  return app;
});
