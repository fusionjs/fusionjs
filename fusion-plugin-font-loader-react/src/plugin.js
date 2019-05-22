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
import {
  generateAtomicFontFaces,
  generateStyledFontFaces,
} from './generate-font-faces';
import {FontLoaderReactConfigToken as ConfigToken} from './tokens';
import type {
  PluginType,
  AtomicFontsObjectType,
  StyledFontsObjectType,
} from './types.js';

let preloadSession;

const plugin = createPlugin({
  deps: {
    config: ConfigToken,
  },
  provides: ({config}) => {
    if (!preloadSession) {
      const {fonts, preloadDepth} = config;
      const atomicFonts: AtomicFontsObjectType = (fonts: any);
      const fallbackLookup = generateFallbackMap(
        atomicFonts,
        preloadDepth || 0
      );
      preloadSession = new PreloadSession(fallbackLookup);
    }
    return preloadSession.getFontDetails;
  },
  middleware: ({config}) => {
    const {fonts, preloadDepth, withStyleOverloads, preloadOverrides} = config;
    const atomicFonts: AtomicFontsObjectType = (fonts: any);
    const styledFonts: StyledFontsObjectType = (fonts: any);
    if (!preloadSession) {
      const fallbackLookup = generateFallbackMap(
        atomicFonts,
        preloadDepth || 0
      );
      preloadSession = new PreloadSession(fallbackLookup);
    }

    return (ctx, next) => {
      if (ctx.element) {
        return next().then(() => {
          if (__NODE__) {
            ctx.template.head.push(html`<style>`);
            if (withStyleOverloads) {
              ctx.template.head.push(
                dangerouslySetHTML(generateStyledFontFaces(styledFonts))
              );
            } else {
              ctx.template.head.push(
                dangerouslySetHTML(generateAtomicFontFaces(atomicFonts))
              );
            }
            ctx.template.head.push(html`</style>`);
            if (!withStyleOverloads) {
              const atomicFonts: AtomicFontsObjectType = (fonts: any);
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
