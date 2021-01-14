/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import path from 'path';
import fs from 'fs';

import React from 'react';
import {createPlugin, dangerouslySetHTML} from 'fusion-core';

import {Provider as StyletronProvider} from 'styletron-react';

import {workerRoute, wasmRoute, AtomicPrefixToken} from './constants.js';

let workerPath;
let wasmPath;

if (__DEV__ && __NODE__) {
  const base = path.dirname(require.resolve('css-to-js-sourcemap-worker'));
  workerPath = path.resolve(base, 'worker.js');
  wasmPath = path.resolve(base, 'mappings.wasm');
}

function getPlugin(getStyletronEngine: any): any {
  const plugin =
    __NODE__ &&
    createPlugin({
      deps: {
        prefix: AtomicPrefixToken.optional,
      },
      middleware: ({prefix}) => (ctx, next) => {
        if (__DEV__) {
          if (ctx.url === workerRoute) {
            ctx.body = fs.createReadStream(workerPath);
            return next();
          }
          if (ctx.url === wasmRoute) {
            ctx.body = fs.createReadStream(wasmPath);
            return next();
          }
        }

        if (ctx.element) {
          const config = prefix === void 0 ? void 0 : {prefix};
          const engine = getStyletronEngine(config);

          ctx.element = (
            <StyletronProvider value={engine}>{ctx.element}</StyletronProvider>
          );

          return next().then(() => {
            const stylesForHead = engine.getStylesheetsHtml();
            ctx.template.head.push(dangerouslySetHTML(stylesForHead));
          });
        } else {
          return next();
        }
      },
    });
  return plugin;
}

export default getPlugin;
