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
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {I18nLoaderToken} from './tokens.js';
import createLoader from './loader.js';
import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  IEmitter,
} from './types.js';

// exported for testing
export function matchesLiteralSections(literalSections: Array<string>) {
  return (translation: string) => {
    let lastMatchIndex = 0;

    if (literalSections.length === 1) {
      const literal = literalSections[0];
      return literal !== '' && translation === literal;
    }

    return literalSections.every((literal, literalIndex) => {
      if (literal === '') {
        // literal section either:
        // - starts/ends the literal
        // - is the result of two adjacent interpolations
        return true;
      } else if (literalIndex === 0 && translation.startsWith(literal)) {
        lastMatchIndex += literal.length;
        return true;
      } else if (
        literalIndex === literalSections.length - 1 &&
        translation.endsWith(literal)
      ) {
        return true;
      } else {
        // start search from `lastMatchIndex`
        const matchIndex = translation.indexOf(literal, lastMatchIndex);
        if (matchIndex !== -1) {
          lastMatchIndex = matchIndex + literal.length;
          return true;
        }
      }
      // matching failed
      return false;
    });
  };
}

type PluginType = FusionPlugin<I18nDepsType, I18nServiceType>;
const pluginFactory: () => PluginType = () =>
  createPlugin({
    deps: {
      loader: I18nLoaderToken.optional,
      events: UniversalEventsToken,
    },
    provides: ({loader, events}) => {
      class I18n {
        translations: TranslationsObjectType;
        locale: string | Locale;
        emitter: ?IEmitter;

        constructor(ctx) {
          if (!loader) {
            loader = createLoader();
          }
          const {translations, locale} = loader.from(ctx);
          this.emitter = events && events.from(ctx);
          this.translations = translations;
          this.locale = locale;
        }
        async load() {} //mirror client API
        translate(key, interpolations = {}) {
          const template = this.translations[key];

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
          const possibleTranslations = i18n.translations
            ? Object.keys(i18n.translations)
            : [];
          chunks.forEach(id => {
            const keys = Array.from(
              chunkTranslationMap.translationsForChunk(id)
            );
            keys.forEach(key => {
              if (Array.isArray(key)) {
                const matches = possibleTranslations.filter(
                  matchesLiteralSections(key)
                );
                for (const match of matches) {
                  translations[match] =
                    i18n.translations && i18n.translations[match];
                }
              } else {
                translations[key] = i18n.translations && i18n.translations[key];
              }
            });
          });
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
          ctx.template.htmlAttrs['lang'] = localeCode;
        } else if (ctx.path === '/_translations') {
          const i18n = plugin.from(ctx);
          const keys = JSON.parse(
            querystring.parse(ctx.querystring).keys || '[]'
          );
          const possibleTranslations = i18n.translations
            ? Object.keys(i18n.translations)
            : [];
          const translations = keys.reduce((acc, key) => {
            if (Array.isArray(key)) {
              const matches = possibleTranslations.filter(
                matchesLiteralSections(key)
              );
              for (const match of matches) {
                acc[match] = i18n.translations && i18n.translations[match];
              }
            } else {
              acc[key] = i18n.translations && i18n.translations[key];
            }
            return acc;
          }, {});
          ctx.body = translations;
          return next();
        } else {
          return next();
        }
      };
    },
  });

export default ((__NODE__ && pluginFactory(): any): PluginType);
