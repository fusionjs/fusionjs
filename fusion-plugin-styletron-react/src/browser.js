/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import React from 'react';
import Styletron from 'styletron-client';
import {StyletronProvider} from 'styletron-react';
import {createPlugin} from 'fusion-core';

let styletron;

export default __BROWSER__ &&
  createPlugin({
    middleware: () => (ctx, next) => {
      if (ctx.element) {
        if (!styletron) {
          const styleElements = document.getElementsByClassName(
            '_styletron_hydrate_'
          );
          styletron = new Styletron(styleElements);
        }
        ctx.element = (
          <StyletronProvider styletron={styletron}>
            {ctx.element}
          </StyletronProvider>
        );
      }

      return next();
    },
  });
