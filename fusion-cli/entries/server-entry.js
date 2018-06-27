/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import http from 'http';

import {createPlugin, getEnv, HttpServerToken} from 'fusion-core';

import AssetsFactory from '../plugins/assets-plugin';
import ContextPlugin from '../plugins/context-plugin';
import ServerErrorPlugin from '../plugins/server-error-plugin';
import stripRoutePrefix from '../lib/strip-prefix.js';

// $FlowFixMe
import '__SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__!'; // eslint-disable-line

const {prefix, webpackPublicPath} = getEnv();

let AssetsPlugin;

/*
Webpack has a configuration option called `publicPath`, which determines the
base path for all assets within an application

The property can be set at runtime by assigning to a magic
global variable called `__webpack_public_path__`.

We set this value at runtime because its value depends on the
`ROUTE_PREFIX` and `CDN_URL` environment variables.

Webpack compiles the `__webpack_public_path__ = ...` assignment expression
into `__webpack_require__.p = ...` and uses it for HMR manifest requests
*/
// $FlowFixMe
__webpack_public_path__ = webpackPublicPath + '/'; // eslint-disable-line

// The shared entry must be imported after setting __webpack_public_path__.
// We use a require as imports are hoisted and would be run before setting __webpack_public_path__.
// $FlowFixMe
const main = require('__FRAMEWORK_SHARED_ENTRY__'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

let server = null;
const state = {serve: null};
const initialize = main
  ? main.default || main
  : () => {
      throw new Error('App should export a function');
    };

export async function start({port, dir = '.'} /*: any */) {
  AssetsPlugin = AssetsFactory(dir);
  // TODO(#21): support https.createServer(credentials, listener);
  server = http.createServer();

  await reload();

  server.on('request', (req, res) => {
    if (prefix) stripRoutePrefix(req, prefix);
    // $FlowFixMe
    state.serve(req, res).catch(e => {
      // $FlowFixMe
      state.app.onerror(e);
    });
  });

  return new Promise(resolve => {
    server &&
      server.listen(port, () => {
        resolve(server);
      });
  });
}

async function reload() {
  const app = await initialize();
  reverseRegister(app, AssetsPlugin);
  reverseRegister(app, ContextPlugin);
  if (server) {
    app.register(HttpServerToken, createPlugin({provides: () => server}));
  }
  if (__DEV__) {
    reverseRegister(app, ServerErrorPlugin);
  }
  state.serve = app.callback();
  // $FlowFixMe
  state.app = app;
}

function reverseRegister(app, token, plugin) {
  app.register(token, plugin);
  app.plugins.unshift(app.plugins.pop());
}

// $FlowFixMe
if (module.hot) {
  // $FlowFixMe
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
  // $FlowFixMe
  module.hot.accept('__SECRET_BUNDLE_MAP_LOADER__!');
  // $FlowFixMe
  module.hot.accept('__SECRET_SYNC_CHUNK_IDS_LOADER__!');
}
