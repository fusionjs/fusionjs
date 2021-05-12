// @noflow
import App from 'fusion-core';

export default () => {
  const app = new App('element', el => el);
  const err = new Error('error without stack');
  err.stack = 'error-without-stack';
  throw err;
  return app;
};
