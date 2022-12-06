/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env node */

import {Locale} from 'locale';

import {createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin, Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import bodyparser from 'koa-bodyparser';
import querystring from 'querystring';

import {I18nLoaderToken, I18nTranslateFnsToken} from './tokens';
import createLoader from './loader';
import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  IEmitter,
  OptionalTranslateFnsType,
} from './types';
import {translateKey, translateKeys} from './translate';

function getKeysFromContext(ctx: Context): string[] {
  if (ctx.request.body && Array.isArray(ctx.request.body)) {
    return ctx.request.body as any;
  }

  const querystringParams = querystring.parse(ctx.querystring);
  if (querystringParams.keys) {
    try {
      // todo: querystringParams.keys might be array
      const keys = JSON.parse(querystringParams.keys as string);
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
      const loaderPlugin = loader || createLoader();
      const service = {
        from: memoize((ctx) => {
          const loaderInstance = loaderPlugin.from(ctx);
          const emitter = events && events.from(ctx);

          if (!translateFns && loaderInstance.getTranslations) {
            return new OptimizedI18n(emitter, loaderInstance);
          }

          return new I18n(emitter, loaderInstance, translateFns);
        }),
      };
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

          const keys = new Set<string>();
          chunks.forEach((id) => {
            const iterator = chunkTranslationMap.translationsForChunk(id);
            for (const item of iterator) {
              keys.add(item);
            }
          });
          const translations = i18n.getTranslations([...keys]);

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

          // flow does not recognize "string[]" as "(string | string[])[]" - so typing it as any
          const keys: any = getKeysFromContext(ctx);
          const translations = i18n.getTranslations(keys);
          ctx.body = translations;
          ctx.set('cache-control', 'public, max-age=3600'); // cache translations for up to 1 hour
          return next();
        } else {
          return next();
        }
      };
    },
  });

class I18n {
  translations: TranslationsObjectType;
  locale: string | Locale;
  emitter: IEmitter | null | undefined;
  translateFns: OptionalTranslateFnsType;

  constructor(emitter, loaderInstance, translateFns) {
    const {translations, locale} = loaderInstance;
    this.emitter = emitter;
    this.translations = translations;
    this.locale = locale;

    if (translateFns) {
      this.translateFns = translateFns;
    } else {
      this.translateFns = {
        translateKey,
        translateKeys,
      };
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
      this.emitter &&
        this.emitter.emit('i18n-translate-miss', {
          key,
        });
      return key;
    }

    return template.replace(/\${(.*?)}/g, (_, k) =>
      interpolations[k] === void 0 ? '${' + k + '}' : String(interpolations[k])
    );
  }

  getTranslations(keys) {
    const sources = this.translations || {};
    const locale = this.locale || {};
    const translations = this.translateFns.translateKeys(sources, locale, keys);
    return translations;
  }
}

class OptimizedI18n {
  loader: Record<string, any>;
  locale: string | Locale;
  emitter: IEmitter | null | undefined;
  // To keep it compatible with I18n class
  translateFns: OptionalTranslateFnsType = {
    translateKey,
    translateKeys,
  };

  // To keep it compatible with I18n class
  get translations(): TranslationsObjectType {
    return this.loader.getTranslations();
  }

  constructor(emitter, loaderInstance) {
    this.loader = loaderInstance;
    this.emitter = emitter;
    this.locale = loaderInstance.locale;
  }

  async load() {} //mirror client API

  translate(key, interpolations = {}) {
    const template = this.loader.getTranslations([key])[key];

    if (typeof template !== 'string') {
      this.emitter &&
        this.emitter.emit('i18n-translate-miss', {
          key,
        });
      return key;
    }

    return template.replace(/\${(.*?)}/g, (_, k) =>
      interpolations[k] === void 0 ? '${' + k + '}' : String(interpolations[k])
    );
  }

  getTranslations(keys) {
    const translations = this.loader.getTranslations(keys);
    return translations;
  }
}

export default __NODE__ && (pluginFactory() as any as PluginType);
