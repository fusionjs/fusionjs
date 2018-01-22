/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import React from 'react';
import Styletron from 'styletron-server';
import {StyletronProvider} from 'styletron-react';

import {createPlugin, dangerouslySetHTML} from 'fusion-core';

export default createPlugin({
  middleware: () => (ctx, next) => {
    if (ctx.element) {
      const styletron = new Styletron();

      ctx.element = (
        <StyletronProvider styletron={styletron}>
          {ctx.element}
        </StyletronProvider>
      );

      return next().then(() => {
        const stylesForHead = styletron.getStylesheetsHtml();
        ctx.template.head.push(dangerouslySetHTML(stylesForHead));
      });
    } else {
      return next();
    }
  },
});
