import App from 'fusion-core';
import plugin from '../../../../../';

export default () => {
  const app = new App('element', (e) => e);
  app.register(plugin(app));
  return app;
};
