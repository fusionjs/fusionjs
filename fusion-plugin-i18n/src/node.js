/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import querystring from 'querystring';

import {createToken, createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import createLoader from './loader.js';
import type {I18nLoaderType} from './loader.js';

export const I18nLoaderToken: Token<I18nLoaderType> = createToken(
  'I18nLoaderToken'
);
const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      loader: I18nLoaderToken.optional,
    },
    provides: ({loader}) => {
      class I18n {
        translations: Object;
        locale: string;

        constructor(ctx) {
          if (!loader) {
            loader = createLoader();
          }
          const {translations, locale} = loader.from(ctx);
          this.translations = translations;
          this.locale = locale;
        }
        load() {} //mirror client API
        translate(key, interpolations = {}) {
          const template = this.translations[key];
          return template != null
            ? template.replace(/\${(.*?)}/g, (_, k) => interpolations[k])
            : key;
        }
      }
      const plugin = {from: memoize(ctx => new I18n(ctx))};
      return plugin;
    },
    middleware: (_, plugin) => {
      // TODO(#4) refactor: this currently depends on babel plugins in framework's webpack config.
      // Ideally these babel plugins should be part of this package, not hard-coded in framework core
      const chunkTranslationMap = require('../chunk-translation-map');
      return async (ctx, next) => {
        if (ctx.element) {
          await next();
          const i18n = plugin.from(ctx);

          // get the webpack chunks that are used and serialize their translations
          const chunks = [...ctx.syncChunks, ...ctx.preloadChunks];
          const translations = {};
          chunks.forEach(id => {
            const keys = Array.from(
              chunkTranslationMap.translationsForChunk(id)
            );
            keys.forEach(key => {
              translations[key] = i18n.translations[key];
            });
          });
          const serialized = JSON.stringify({chunks, translations});
          const script = html`<script type='application/json' id="__TRANSLATIONS__">${serialized}</script>`; // consumed by ./browser
          // $FlowFixMe
          ctx.template.body.push(script);
        } else if (ctx.path === '/_translations') {
          const i18n = plugin.from(ctx);
          const ids = querystring.parse(ctx.querystring).ids || '';
          const chunks = ids.split(',').map(id => parseInt(id, 10));
          const translations = {};
          chunks.forEach(id => {
            const keys = [...chunkTranslationMap.translationsForChunk(id)];
            keys.forEach(key => {
              translations[key] = i18n.translations[key];
            });
          });
          ctx.body = translations;
          return next();
        } else {
          return next();
        }
      };
    },
  });

export default ((plugin: any): FusionPlugin<*, *>);
