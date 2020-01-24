// @noflow
import App from 'fusion-core';

import fixture from 'fixture-es2017-pkg';

export default async function() {
  const app = new App('element', el => el);
  fixture();
  return app;
}
