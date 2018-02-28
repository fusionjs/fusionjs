/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import React from 'react';
import {createPlugin, dangerouslySetHTML} from 'fusion-core';

import {Provider as StyletronProvider} from 'styletron-react';
import {Server as Styletron} from 'styletron-engine-atomic';

export default __NODE__ &&
  createPlugin({
    middleware: () => (ctx, next) => {
      if (ctx.element) {
        const engine = new Styletron();

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
