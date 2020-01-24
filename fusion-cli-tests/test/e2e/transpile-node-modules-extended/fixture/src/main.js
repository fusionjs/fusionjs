// @flow
import App from 'fusion-core';

import fixture from 'fixture-es2017-pkg';
import other from 'fixture-macro-pkg';

export default async function(args: any) {
  const app = new App('element', el => el);
  fixture();
  other();
  return app;
}
