/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/* eslint-disable import/first */
import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();

// $FlowFixMe
import '__SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__!'; // eslint-disable-line

import http from 'http';

import BaseApp, {
  createPlugin,
  HttpServerToken,
  RoutePrefixToken,
  SSRBodyTemplateToken,
  CriticalChunkIdsToken,
} from 'fusion-core';

import CriticalChunkIdsPlugin from '../plugins/critical-chunk-ids-plugin.js';
import AssetsFactory from '../plugins/assets-plugin';
import ContextPlugin from '../plugins/context-plugin';
import ServerErrorPlugin from '../plugins/server-error-plugin';
import {SSRBodyTemplate} from '../plugins/ssr-plugin';
import stripRoutePrefix from '../lib/strip-prefix.js';

let prefix = process.env.ROUTE_PREFIX;
let AssetsPlugin;

// $FlowFixMe
const main = require('__FUSION_ENTRY_PATH__'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

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
  if (!(app instanceof BaseApp)) {
    throw new Error('Application entry point did not return an App');
  }
  reverseRegister(app, ContextPlugin);
  app.register(AssetsPlugin);
  app.register(SSRBodyTemplateToken, SSRBodyTemplate);
  app.register(CriticalChunkIdsToken, CriticalChunkIdsPlugin);
  if (prefix) {
    app.register(RoutePrefixToken, prefix);
  }
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
  module.hot.accept('__FUSION_ENTRY_PATH__', reload);
  // $FlowFixMe
  module.hot.accept('__SECRET_BUNDLE_MAP_LOADER__!');
  // $FlowFixMe
  module.hot.accept('__SECRET_SYNC_CHUNK_IDS_LOADER__!');
  // $FlowFixMe
  module.hot.accept('__SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__!');
}
