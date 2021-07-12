// @noflow
import App from 'fusion-core';

// initial bundles
import mapbox from '../node_modules/mapbox-gl';
import react from '../node_modules/react';

console.log(mapbox);
console.log(react);

export default (async function () {
  const app = new App('el', (el) => el);
  // split bundle
  const other = import('../node_modules/other');
  app.middleware((ctx, next) => {
    ctx.body = app;
  });
  return app;
});
