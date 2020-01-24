// @noflow
import App from 'fusion-core';

export default async function() {
  const longVariableNameForElement = 'element';
  const app = new App(longVariableNameForElement, el => el);
  return app;
}
