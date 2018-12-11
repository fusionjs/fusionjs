// @noflow
import App from 'fusion-core';
import plugin from './plugin.js';

export default async function() {
  const app = new App('element', el => el);
  app.register(plugin);
  return app;
}
