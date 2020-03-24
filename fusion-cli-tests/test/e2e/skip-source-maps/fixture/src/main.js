// @noflow
import App from 'fusion-core';

export default async function() {
  const app = new App('element', el => el);
  return app;
};
