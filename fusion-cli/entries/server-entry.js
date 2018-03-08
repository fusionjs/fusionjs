/* eslint-env node */
import http from 'http';
import {getEnv} from 'fusion-core';
import AssetsFactory from '../plugins/assets-plugin';
import ContextPlugin from '../plugins/context-plugin';
import ServerErrorPlugin from '../plugins/server-error-plugin';
import stripRoutePrefix from '../lib/strip-prefix.js';

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
// eslint-disable-next-line
__webpack_public_path__ = webpackPublicPath + '/';

// The shared entry must be imported after setting __webpack_public_path__.
// We use a require as imports are hoisted and would be run before setting __webpack_public_path__.
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const main = require('__FRAMEWORK_SHARED_ENTRY__');

const state = {serve: null};
const initialize = main
  ? main.default || main
  : () => {
      throw new Error('App should export a function');
    };

export async function start({port, dir = '.'}) {
  AssetsPlugin = AssetsFactory(dir);
  await reload();

  // TODO(#21): support https.createServer(credentials, listener);
  const server = http.createServer((req, res) => {
    if (prefix) stripRoutePrefix(req, prefix);
    state.serve(req, res).catch(e => {
      state.app.onerror(e);
    });
  });

  return new Promise(resolve => {
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      resolve(server);
    });
  });
}

async function reload() {
  const app = await initialize();
  reverseRegister(app, AssetsPlugin);
  reverseRegister(app, ContextPlugin);
  if (__DEV__) {
    reverseRegister(app, ServerErrorPlugin);
  }
  state.serve = app.callback();
  state.app = app;
}

function reverseRegister(app, token, plugin) {
  app.register(token, plugin);
  app.plugins.unshift(app.plugins.pop());
}

if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
  module.hot.accept('__SECRET_BUNDLE_MAP_LOADER__!');
  module.hot.accept('__SECRET_SYNC_CHUNK_IDS_LOADER__!');
}
