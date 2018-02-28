/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import React from 'react';
import {createPlugin} from 'fusion-core';

import {Provider as StyletronProvider} from 'styletron-react';
import {Client as Styletron} from 'styletron-engine-atomic';

let engine;

export default __BROWSER__ &&
  createPlugin({
    middleware: () => (ctx, next) => {
      if (ctx.element) {
        if (!engine) {
          engine = new Styletron({
            hydrate: document.getElementsByClassName('_styletron_hydrate_'),
          });
        }
        ctx.element = (
          <StyletronProvider value={engine}>{ctx.element}</StyletronProvider>
        );
      }

      return next();
    },
  });
