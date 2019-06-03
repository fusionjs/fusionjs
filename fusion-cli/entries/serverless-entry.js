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

import BaseApp, {
  RoutePrefixToken,
  SSRBodyTemplateToken,
  CriticalChunkIdsToken,
} from 'fusion-core';

import CriticalChunkIdsPlugin from '../plugins/critical-chunk-ids-plugin.js';
import AssetsFactory from '../plugins/assets-plugin';
import ContextPlugin from '../plugins/context-plugin';
import {SSRBodyTemplate} from '../plugins/ssr-plugin';
import stripRoutePrefix from '../lib/strip-prefix.js';

let prefix = process.env.ROUTE_PREFIX;

// $FlowFixMe
const main = require('__FUSION_ENTRY_PATH__'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const initialize = main
  ? main.default || main
  : () => {
      throw new Error('App should export a function');
    };

export default async function loadApp(dir /*: string */ = '.') {
  const app = await initialize();
  if (!(app instanceof BaseApp)) {
    throw new Error('Application entry point did not return an App');
  }
  const AssetsPlugin = AssetsFactory(dir);
  reverseRegister(app, ContextPlugin);
  app.register(AssetsPlugin);
  app.register(SSRBodyTemplateToken, SSRBodyTemplate);
  app.register(CriticalChunkIdsToken, CriticalChunkIdsPlugin);
  if (prefix) {
    app.register(RoutePrefixToken, prefix);
  }
  const appHandler = app.callback();
  const handler = (req /*: any */, res /*: any */) => {
    if (prefix) {
      stripRoutePrefix(req, prefix);
    }
    appHandler(req, res).catch(e => {
      app.onerror(e);
    });
  };
  return handler;
}

function reverseRegister(app, token, plugin) {
  app.register(token, plugin);
  app.plugins.unshift(app.plugins.pop());
}
