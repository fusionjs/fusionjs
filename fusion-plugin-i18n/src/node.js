/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {Locale} from 'locale';

import {createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin, Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import bodyparser from 'koa-bodyparser';
import querystring from 'querystring';

import {I18nLoaderToken, I18nTranslateFnsToken} from './tokens.js';
import createLoader from './loader.js';
import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  IEmitter,
  OptionalTranslateFnsType,
} from './types.js';
import {translateKey, translateKeys} from './translate';

function getKeysFromContext(ctx: Context): string[] {
  if (ctx.request.body && Array.isArray(ctx.request.body)) {
    return (ctx.request.body: any);
  }

  const querystringParams = querystring.parse(ctx.querystring);
  if (querystringParams.keys) {
    try {
      const keys = JSON.parse(querystringParams.keys);
      return Array.isArray(keys) ? keys : [];
    } catch (e) {
      return [];
    }
  }

  return [];
}

type PluginType = FusionPlugin<I18nDepsType, I18nServiceType>;
const pluginFactory: () => PluginType = () =>
  createPlugin({
    deps: {
      loader: I18nLoaderToken.optional,
      events: UniversalEventsToken.optional,
      translateFns: I18nTranslateFnsToken.optional,
    },
    provides: ({loader, events, translateFns}) => {
      class I18n {
        translations: TranslationsObjectType;
        locale: string | Locale;
        emitter: ?IEmitter;
        translateFns: OptionalTranslateFnsType;

        constructor(ctx) {
          if (!loader) {
            loader = createLoader();
          }
          const {translations, locale} = loader.from(ctx);
          this.emitter = events && events.from(ctx);
          this.translations = translations;
          this.locale = locale;
          if (translateFns) {
            this.translateFns = translateFns;
          } else {
            this.translateFns = {translateKey, translateKeys};
          }
        }
        async load() {} //mirror client API
        translate(key, interpolations = {}) {
          const template = this.translateFns.translateKey(
            this.translations,
            this.locale,
            key
          );

          if (typeof template !== 'string') {
            this.emitter && this.emitter.emit('i18n-translate-miss', {key});
            return key;
          }

          return template.replace(/\${(.*?)}/g, (_, k) =>
            interpolations[k] === void 0
              ? '${' + k + '}'
              : String(interpolations[k])
          );
        }
      }

      const service = {from: memoize(ctx => new I18n(ctx))};
      return service;
    },
    middleware: (_, plugin) => {
      // TODO(#4) refactor: this currently depends on babel plugins in framework's webpack config.
      // Ideally these babel plugins should be part of this package, not hard-coded in framework core
      const chunkTranslationMap = require('../chunk-translation-map');
      const parseBody = bodyparser();

      return async (ctx, next) => {
        if (ctx.element) {
          await next();
          const i18n = plugin.from(ctx);

          // get the webpack chunks that are used and serialize their translations
          const chunks: Array<string | number> = [
            ...ctx.syncChunks,
            ...ctx.preloadChunks,
          ];

          const keys = new Set();
          chunks.forEach(id => {
            const iterator = chunkTranslationMap.translationsForChunk(id);
            for (const item of iterator) {
              keys.add(item);
            }
          });

          const sources = i18n.translations || {};
          const locale = i18n.locale || {};
          const translations =
            i18n.translateFns &&
            i18n.translateFns.translateKeys(sources, locale, [...keys]);

          // i18n.locale is actually a locale.Locale instance
          if (!i18n.locale) {
            throw new Error('i18n.locale was empty');
          }

          const localeCode =
            typeof i18n.locale === 'string' ? i18n.locale : i18n.locale.code;
          const serialized = JSON.stringify({localeCode, translations});
          const script = html`
            <script type="application/json" id="__TRANSLATIONS__">
              ${serialized}
            </script>
          `; // consumed by ./browser
          ctx.template.body.push(script);

          // set HTML lang tag as a hint for signal screen readers to switch to the
          // recommended language.
          ctx.template.htmlAttrs.lang = localeCode;
        } else if (ctx.path === '/_translations') {
          const i18n = plugin.from(ctx);
          try {
            await parseBody(ctx, () => Promise.resolve());
          } catch (e) {
            ctx.request.body = [];
          }

          const keys = getKeysFromContext(ctx);
          const sources = i18n.translations || {};
          const localeCode = i18n.locale || {};

          const translations =
            i18n.translateFns &&
            i18n.translateFns.translateKeys(sources, localeCode, keys);
          ctx.body = translations;
          ctx.set('cache-control', 'public, max-age=3600'); // cache translations for up to 1 hour
          return next();
        } else {
          return next();
        }
      };
    },
  });

export default ((__NODE__ && pluginFactory(): any): PluginType);
