//@flow
/* eslint-env node */
import http from 'http';
import main from '__FRAMEWORK_SHARED_ENTRY__';
import CompilationMetaDataFactory from '../plugins/compilation-metadata-plugin';
import AssetsFactory from '../plugins/assets-plugin';
import ContextFactory from '../plugins/context-plugin';

const CompilationMetaData = CompilationMetaDataFactory();
const Assets = AssetsFactory();
const Context = ContextFactory();

/*
Webpack has a configuration option called `publicPath`, which determines the
base path for all assets within an application

The property can be set at runtime by assigning to a magic
global variable called `__webpack_public_path__`.

We set this value at runtime because its value depends on the
`ROUTE_PREFIX` and `FRAMEWORK_ASSET_PATH` environment variables.

The value of the env var is sent from the server to the client
by the `/plugins/compilation-metadata-plugin.js` file. It creates
a `window.__WEBPACK_PUBLIC_PATH__` global variable in the entry point html with the
value from the environment variables above

Webpack compiles the `__webpack_public_path__ = ...` assignment expression
into `__webpack_require__.p = ...` and uses it for HMR manifest requests
*/
// eslint-disable-next-line
__webpack_public_path__ = CompilationMetaData.of().webpackPublicPath + '/';

const state = {serve: null};
const initialize = main
  ? main.default || main
  : () => {
      throw new Error('App should export a function');
    };

export async function start({port}) {
  await reload();

  // TODO(#21): support https.createServer(credentials, listener);
  const server = http.createServer((req, res) => {
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
  app.plugins = [Assets, Context].concat(app.plugins);
  state.serve = app.callback();
  state.app = app;
}

if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
  module.hot.accept('__SECRET_BUNDLE_MAP_LOADER__!');
  module.hot.accept('__SECRET_SYNC_CHUNK_IDS_LOADER__!');
}
