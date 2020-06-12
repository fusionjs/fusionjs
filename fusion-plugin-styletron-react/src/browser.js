/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* global module */

import React from 'react';
import {createPlugin} from 'fusion-core';

import {Provider as StyletronProvider, DebugEngine} from 'styletron-react';

import {workerRoute, wasmRoute, AtomicPrefixToken} from './constants.js';

let debugEngine;
let engine;

function getPlugin(getStyletronEngine: any): any {
  const plugin =
    __BROWSER__ &&
    createPlugin({
      deps: {
        prefix: AtomicPrefixToken.optional,
      },
      middleware: ({prefix}) => (ctx, next) => {
        if (ctx.element) {
          if (!engine) {
            const config: {
              hydrate: HTMLCollection<HTMLElement>,
              prefix?: string,
            } = {
              hydrate: document.getElementsByClassName('_styletron_hydrate_'),
            };
            if (prefix !== void 0) {
              config.prefix = prefix;
            }
            engine = getStyletronEngine(config);
          }
          if (__DEV__ && !debugEngine && typeof Worker !== 'undefined') {
            const worker = new Worker(workerRoute);
            worker.postMessage({
              id: 'init_wasm',
              url: wasmRoute,
            });
            worker.postMessage({
              id: 'set_render_interval',
              interval: 180,
            });
            if ((module: any).hot) {
              (module: any).hot.addStatusHandler(status => {
                if (status === 'dispose') {
                  worker.postMessage({id: 'invalidate'});
                }
              });
            }
            debugEngine = new DebugEngine(worker);
          }
          ctx.element = (
            <StyletronProvider
              value={engine}
              debug={debugEngine}
              debugAfterHydration={Boolean(debugEngine)}
            >
              {ctx.element}
            </StyletronProvider>
          );
        }

        return next();
      },
    });
  return plugin;
}

export default getPlugin;
