/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import querystring from 'querystring';
import {Locale} from 'locale';

import {createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';

import {I18nLoaderToken} from './tokens.js';
import createLoader from './loader.js';
import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
} from './types.js';

type PluginType = FusionPlugin<I18nDepsType, I18nServiceType>;
const pluginFactory: () => PluginType = () =>
  createPlugin({
    deps: {
      loader: I18nLoaderToken.optional,
    },
    provides: ({loader}) => {
      class I18n {
        translations: TranslationsObjectType;
        locale: string | Locale;

        constructor(ctx) {
          if (!loader) {
            loader = createLoader();
          }
          const {translations, locale} = loader.from(ctx);
          // eslint-disable-next-line no-console
          this.translations = translations;
          this.locale = locale;
        }
        async load() {} //mirror client API
        translate(key, interpolations = {}) {
          const template = this.translations[key];
          return template != null
            ? template.replace(/\${(.*?)}/g, (_, k) =>
                interpolations[k] === void 0
                  ? '${' + k + '}'
                  : interpolations[k]
              )
            : key;
        }
      }

      const service = {from: memoize(ctx => new I18n(ctx))};
      return service;
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
          const chunks: Array<string | number> = [
            ...ctx.syncChunks,
            ...ctx.preloadChunks,
          ];
          const translations = {};
          chunks.forEach(id => {
            const keys = Array.from(
              chunkTranslationMap.translationsForChunk(id)
            );
            keys.forEach(key => {
              translations[key] = i18n.translations && i18n.translations[key];
            });
          });
          // i18n.locale is actually a locale.Locale instance
          if (!i18n.locale) {
            throw new Error('i18n.locale was empty');
          }
          const localeCode =
            typeof i18n.locale === 'string' ? i18n.locale : i18n.locale.code;
          const serialized = JSON.stringify({chunks, localeCode, translations});
          const script = html`
            <script type="application/json" id="__TRANSLATIONS__">
              ${serialized}
            </script>
          `; // consumed by ./browser
          ctx.template.body.push(script);

          // set HTML lang tag as a hint for signal screen readers to switch to the
          // recommended language.
          ctx.template.htmlAttrs['lang'] = localeCode;
        } else if (ctx.path === '/_translations') {
          const i18n = plugin.from(ctx);
          const ids = querystring.parse(ctx.querystring).ids || '';
          const chunks = ids.split(',').map(id => {
            const parsed = parseInt(id, 10);
            return Number.isNaN(parsed) ? id : parsed;
          });
          const translations = {};
          chunks.forEach(id => {
            const keys = [...chunkTranslationMap.translationsForChunk(id)];
            keys.forEach(key => {
              translations[key] = i18n.translations && i18n.translations[key];
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

export default ((__NODE__ && pluginFactory(): any): PluginType);
