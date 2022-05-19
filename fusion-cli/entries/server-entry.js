/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
/* global __webpack_hash__ */

/* eslint-disable import/first */
import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();

// $FlowFixMe[cannot-resolve-module]
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
import {SSRModuleScriptsBodyTemplate} from '../plugins/ssr-module-scripts-plugin';
import stripRoutePrefix from '../lib/strip-prefix.js';
// $FlowFixMe[cannot-resolve-module]
import main from '__FUSION_ENTRY_PATH__'; // eslint-disable-line import/no-unresolved

let prefix = process.env.ROUTE_PREFIX;
let AssetsPlugin;

let server = null;
const state = {serve: null};
function getInitialize() {
  return typeof main === 'function'
    ? main
    : () => {
        throw new Error('App should export a function');
      };
}

let initialReloadOptions;
export async function start(
  {port, dir = '.', useModuleScripts = false} /*: any */
) {
  AssetsPlugin = AssetsFactory(dir);
  // TODO(#21): support https.createServer(credentials, listener);
  server = http.createServer();

  initialReloadOptions = {useModuleScripts};
  await reload(initialReloadOptions);

  server.on('request', (req, res) => {
    if (prefix) stripRoutePrefix(req, prefix);
    // $FlowFixMe[not-a-function]
    state.serve(req, res).catch((e) => {
      // $FlowFixMe[prop-missing]
      state.app.onerror(e);
    });
  });

  return new Promise((resolve) => {
    server &&
      server.listen(port, () => {
        resolve(server);
      });
  });
}

let prevApp = null;
async function reload(
  {useModuleScripts} /* : { useModuleScripts?: boolean } */
) {
  if (prevApp) {
    await prevApp.cleanup();
    prevApp = null;
  }

  const initialize = getInitialize();
  const app = await initialize();
  if (!(app instanceof BaseApp)) {
    throw new Error('Application entry point did not return an App');
  }
  reverseRegister(app, ContextPlugin);
  app.register(AssetsPlugin);
  app.register(
    SSRBodyTemplateToken,
    useModuleScripts ? SSRModuleScriptsBodyTemplate : SSRBodyTemplate
  );
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
  // $FlowFixMe[prop-missing]
  state.app = prevApp = app;
}

function reverseRegister(app, token, plugin) {
  app.register(token, plugin);
  const entries = Array.from(app.taskMap.entries());
  entries.unshift(entries.pop());
  app.taskMap = new Map(entries);
}

if (module.hot) {
  let hasFailedUpdate = false;

  // $FlowFixMe[cannot-resolve-name]
  let latestServerBuildHash = __webpack_hash__;
  const isUpToDate = () => {
    return latestServerBuildHash === __webpack_hash__;
  };

  let needReload = false;
  let reloadPromise = Promise.resolve();
  const checkForUpdate = () => {
    return (
      module.hot
        // $FlowFixMe[prop-missing]
        .check(true)
        .then(function (updatedModules) {
          if (updatedModules && updatedModules.length) {
            console.log('[HMR] Updated modules');
            updatedModules.forEach(function (m) {
              // Do not output internal modules
              if (m.includes('/fusion-cli/')) {
                return;
              }

              console.log('[HMR]  - ', m);
            });
          }

          if (!isUpToDate()) {
            return checkForUpdate();
          }

          if (needReload) {
            needReload = false;

            const curReloadPromise = (reloadPromise = reloadPromise.then(
              function () {
                function skip() {
                  return curReloadPromise !== reloadPromise || !isUpToDate();
                }

                if (skip()) {
                  return false;
                }

                return reload(initialReloadOptions).then(function () {
                  return !skip();
                });
              }
            ));

            return curReloadPromise;
          }

          return true;
        })
    );
  };

  const onProcessMessage = (data) => {
    if (hasFailedUpdate) {
      return;
    }

    if (data.event === 'update') {
      latestServerBuildHash = data.serverBuildHash;

      // $FlowFixMe[prop-missing]
      if (module.hot.status() === 'idle') {
        checkForUpdate()
          .then((isReady) => {
            if (!isReady) {
              return;
            }

            // $FlowFixMe[not-a-function]
            process.send({
              event: 'ready',
              serverBuildHash: latestServerBuildHash,
            });
          })
          .catch(function (err) {
            if (hasFailedUpdate) {
              return;
            }
            hasFailedUpdate = true;

            process.off('message', onProcessMessage);
            process.nextTick(() => {
              // $FlowFixMe[not-a-function]
              process.send({event: 'update-failed'});
            });
            global.__DEV_RUNTIME_LOG_ERROR__(err);
          });
      }
    }
  };
  process.on('message', onProcessMessage);

  const onAcceptReload = () => {
    // Defer reload until everything is up-to-date
    needReload = true;
  };

  module.hot.accept('__FUSION_ENTRY_PATH__', onAcceptReload);
  module.hot.accept(
    '__SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__!',
    onAcceptReload
  );
  module.hot.accept('../plugins/ssr-plugin.js', onAcceptReload);
  module.hot.accept('../plugins/ssr-module-scripts-plugin.js', onAcceptReload);
  module.hot.accept('../plugins/assets-plugin.js', onAcceptReload);
  module.hot.accept('../plugins/critical-chunk-ids-plugin.js', onAcceptReload);
  module.hot.accept('../plugins/context-plugin.js', onAcceptReload);

  // $FlowFixMe[prop-missing]
  module.hot.decline();
}
