/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {createPlugin, dangerouslySetHTML} from 'fusion-core';
import {HelmetProvider} from 'react-helmet-async';

import type {FusionPlugin} from 'fusion-core';

const keys = ['meta', 'link', 'style', 'base', 'noscript', 'script'];

const plugin =
  __NODE__ &&
  createPlugin({
    middleware: () => {
      return async (ctx, next) => {
        if (!ctx.element) {
          return next();
        }
        const helmetContext = {};
        ctx.element = (
          <HelmetProvider context={helmetContext}>{ctx.element}</HelmetProvider>
        );
        await next();
        const {helmet} = helmetContext;
        if (helmet) {
          ctx.template.title = dangerouslySetHTML(
            helmet.title
              .toString()
              .replace('</title>', '')
              .replace(/^<title.*>/, '')
          );
          keys.forEach(key => {
            ctx.template.head.push(dangerouslySetHTML(helmet[key].toString()));
          });
          Object.assign(
            ctx.template.htmlAttrs,
            helmet.htmlAttributes.toComponent()
          );
        }
      };
    },
  });

export default ((plugin: any): FusionPlugin<void, void>);
