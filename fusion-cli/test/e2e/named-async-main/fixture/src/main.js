// @noflow
import App from 'fusion-core';
import HealthPlugin from './plugins/health.js';

export default async function start(something /*: any */) {
  const app = new App('element', el => el);
  app.middleware(HealthPlugin);
  return app;
}
