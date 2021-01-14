/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {createPlugin, html, dangerouslySetHTML} from 'fusion-core';
import PreloadSession from './preload-session';
import generateFallbackMap from './generate-fallback-map';
import generatePreloadLinks from './generate-preload-links';
import {generateFontFaces} from './generate-font-faces';
import {FontLoaderReactConfigToken as ConfigToken} from './tokens';
import type {PluginType, AtomicFontsObjectType} from './types.js';

let preloadSession;

// TODO dedupe etc.
const plugin = createPlugin({
  deps: {
    config: ConfigToken,
  },
  provides: ({config}) => {
    const {fonts, preloadDepth} = config;
    let hasAtomicFonts = false;
    const atomicFonts: AtomicFontsObjectType = Object.keys(fonts).reduce(
      (result, fontName) => {
        const thisFont = fonts[fontName];
        if (!Array.isArray(thisFont)) {
          hasAtomicFonts = true;
          result[fontName] = thisFont;
        }
        return result;
      },
      {}
    );
    if (hasAtomicFonts) {
      const fallbackLookup = generateFallbackMap(
        atomicFonts,
        preloadDepth || 0
      );
      preloadSession = new PreloadSession(fallbackLookup);
      return {
        getFontDetails: preloadSession.getFontDetails,
        atomicFonts,
      };
    }
    return {getFontDetails: null, atomicFonts: null};
  },
  middleware: ({config}, {atomicFonts}) => {
    const {fonts, preloadOverrides} = config;

    return (ctx, next) => {
      if (ctx.element) {
        return next().then(() => {
          if (__NODE__) {
            ctx.template.head.push(html`<style>`);
            ctx.template.head.push(
              dangerouslySetHTML(generateFontFaces(fonts))
            );
            ctx.template.head.push(html`</style>`);
            if (atomicFonts) {
              ctx.template.head.push(
                dangerouslySetHTML(
                  generatePreloadLinks(
                    preloadOverrides || preloadSession.fontsToPreload,
                    atomicFonts
                  )
                )
              );
            }
          }
        });
      } else {
        return next();
      }
    };
  },
});
export default (plugin: PluginType);
