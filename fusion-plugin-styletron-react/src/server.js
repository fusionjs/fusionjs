/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import React from 'react';
import {createPlugin, dangerouslySetHTML} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';

import {Provider as StyletronProvider} from 'styletron-react';
import {Server as Styletron} from 'styletron-engine-atomic';

import LegacyProvider from './legacy-provider.js';
import {injectDeclarationCompatMixin} from './inject-declaration-compat-mixin.js';

const StyletronCompat = injectDeclarationCompatMixin(Styletron);

const plugin =
  __NODE__ &&
  createPlugin({
    middleware: () => (ctx, next) => {
      if (ctx.element) {
        const engine = new StyletronCompat();

        ctx.element = (
          <StyletronProvider value={engine}>
            <LegacyProvider value={engine}>{ctx.element}</LegacyProvider>
          </StyletronProvider>
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

export default ((plugin: any): FusionPlugin<*, *>);
