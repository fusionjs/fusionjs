// @flow

import App from 'fusion-core';
import introspect from '../../../..';

export default () => {
  const app = new App('element', e => e);
  app.register(introspect(app));
  return app;
};
