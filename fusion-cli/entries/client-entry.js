/* eslint-env browser */
/* global module */

import 'core-js/es6';
import 'core-js/es7';

// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
import initialize from '__FRAMEWORK_SHARED_ENTRY__';

/*
Webpack has a configuration option called `publicPath`, which determines the
base path for all assets within an application

The property can be set at runtime by assigning to a magic
global variable called `__webpack_public_path__`.

We set this value at runtime because its value depends on the
`ROUTE_PREFIX` and `CDN_URL` environment variables.

The value of the env var is sent from the server to the client
by the `../get-compilation-metadata.js` file. It creates
a `window.__WEBPACK_PUBLIC_PATH__` global variable in the entry point html with the
value from the environment variables above

Webpack compiles the `__webpack_public_path__ = ...` assignment expression
into `__webpack_require__.p = ...` and uses it for HMR manifest requests
*/
// eslint-disable-next-line
__webpack_public_path__ = window.__WEBPACK_PUBLIC_PATH__ + '/';

function reload() {
  Promise.resolve(initialize()).then(app => {
    app.callback().call();
  });
}
reload();

if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
}
