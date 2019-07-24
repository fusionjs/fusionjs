// @noflow
import App from 'fusion-core';

export default (async function() {
  const aPromise = import('./test-a.js');
  const bPromise = import('./test-b.js');
  const cPromise = import('./test-combined.js');
  const dPromise = import('./test-transitive.js');

  const app = new App(
    'element',
    el => {
      if (__NODE__) {
        return `<div id="ssr">${dPromise.__CHUNK_IDS}</div>`;
      } else {
        document.body.innerHTML = `<div id="csr">${dPromise.__CHUNK_IDS}</div>`;
      }
    }
  );

  app.middleware((ctx, next) => {
    if (ctx.path === '/test-a') {
      ctx.body = aPromise.__CHUNK_IDS;
    } else if (ctx.path === '/test-b') {
      ctx.body = bPromise.__CHUNK_IDS;
    } else if (ctx.path === '/test-combined') {
      ctx.body = cPromise.__CHUNK_IDS;
    } else if (ctx.path === '/test-transitive') {
      ctx.body = dPromise.__CHUNK_IDS;
    }
    return next();
  });
  return app;
});
