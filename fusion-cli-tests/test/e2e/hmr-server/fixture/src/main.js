// @noflow
import React from 'react';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';

import root from './root.js';

if (__NODE__) {
  if (global.__TEST_TRIGGER_PROCESS_EXIT__) {
    process.exit(1);
  }

  if (global.__TEST_TRIGGER_SCRIPT_INIT_ERROR__) {
    throw new Error('Script initialization error');
  }
}

export default async function start() {
  const app = new App(root);

  if (__NODE__) {
    // Can not use import statement with these node-only plugins,
    // as the build process relies on the minifier to prune them.
    const ServerTestEndpointPlugin = require('./plugins/server-test-endpoint.js').default;
    const ServerHmrStatsPlugin = require('./plugins/server-hmr-stats.js').default;
    app.register(ServerTestEndpointPlugin);
    app.register(ServerHmrStatsPlugin);
    app.register(createPlugin({
      provides() {
        if (global.__TEST_TRIGGER_HMR_ONLY_ERROR__ && global.__TEST_ENABLE_HMR_ONLY_ERROR__) {
          throw new Error('Failed to initialize during HMR');
        }
        global.__TEST_ENABLE_HMR_ONLY_ERROR__ = true;
      }
    }));
  } else if (__BROWSER__) {
    // Can not use import statement with these browser-only plugins,
    // as the build process relies on the minifier to prune them.
    const BrowserOnlyPlugin = require('./plugins/browser-only.js').default;
    app.register(BrowserOnlyPlugin);
  }

  return app;
}

if (__BROWSER__ && module.hot) {
  window.__addHotStatusHandler = (handler) => {
    module.hot.addStatusHandler(handler);
  };
}
