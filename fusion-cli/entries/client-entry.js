/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* global module */

import 'core-js/es6';
import 'core-js/es7';

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

/* eslint-disable */
// $FlowFixMe
__webpack_public_path__ = window.__WEBPACK_PUBLIC_PATH__ + '/';
/* eslint-enable */

function reload() {
  // $FlowFixMe
  const main = require('__FRAMEWORK_SHARED_ENTRY__'); // eslint-disable-line
  const initialize = main.default || main;
  Promise.resolve(initialize()).then(app => {
    app.callback().call();
  });
}
reload();

// $FlowFixMe
if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
}
