// @noflow
import App from 'fusion-core';

// initial bundles
import mapbox from 'mapbox-gl';
import react from 'react';

console.log(mapbox);
console.log(react);

export default (async function() {
  const app = new App('el', el => el);
  // split bundle
  const other = import('../node_modules/other');
  app.middleware((ctx, next) => {
    ctx.body = app;
  });
  return app;
});
