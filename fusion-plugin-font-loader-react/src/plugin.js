/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import React from 'react';

import {createPlugin, html, dangerouslySetHTML} from 'fusion-core';

import FontProvider from './provider';
import generateFallbackMap from './generate-fallback-map';
import generatePreloadLinks from './generate-preload-links';
import generateFontFaces from './generate-font-faces';
import {FontLoaderReactConfigToken as ConfigToken} from './tokens';
import type {PluginType} from './types.js';

// keys are the actual fonts to preload (based on usage on the page), values are always true
const fontsToPreload = {};
let fallbackLookup;

const plugin = createPlugin({
  deps: {
    config: ConfigToken,
  },
  middleware: ({config}) => {
    const {fonts, preloadDepth} = config;
    fallbackLookup = generateFallbackMap(fonts, preloadDepth);

    return (ctx, next) => {
      if (ctx.element) {
        ctx.element = (
          <FontProvider getFontDetails={getFontDetails}>
            {ctx.element}
          </FontProvider>
        );
        return next().then(() => {
          if (__NODE__) {
            ctx.template.head.push(html`<style>`);
            ctx.template.head.push(
              dangerouslySetHTML(generateFontFaces(fonts))
            );
            ctx.template.head.push(html`</style>`);
            ctx.template.head.push(
              dangerouslySetHTML(generatePreloadLinks(fontsToPreload, fonts))
            );
          }
        });
      } else {
        return next();
      }
    };
  },
});
export default (plugin: PluginType);

/* Helper functions */
function getFontDetails(name) {
  const {name: fallbackName, styles = {}} = fallbackLookup[name] || {};
  const result = {
    name,
    fallbackName,
    styles,
  };
  if (__NODE__) {
    // preload fallback, or if font has no fallback preload font itself
    fontsToPreload[fallbackName || name] = true;
  }
  return result;
}
