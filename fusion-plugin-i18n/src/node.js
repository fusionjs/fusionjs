/* eslint-env node */
import querystring from 'querystring';
import {Plugin, html} from 'fusion-core';

export default function({TranslationsLoader}) {
  // TODO(#4) refactor: this currently depends on babel plugins in framework's webpack config. Ideally these babel plugins should be part of this package, not hard-coded in framework core
  const chunkTranslationMap = require('../chunk-translation-map');

  return new Plugin({
    Service: class I18n {
      constructor(ctx) {
        const {translations, locale} = TranslationsLoader.of(ctx);
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
    },
    async middleware(ctx, next) {
      if (ctx.element) {
        await next();
        const i18n = this.of(ctx);

        // get the webpack chunks that are used and serialize their translations
        const chunks = [...ctx.syncChunks, ...ctx.preloadChunks];
        const translations = {};
        chunks.forEach(id => {
          const keys = Array.from(chunkTranslationMap.translationsForChunk(id));
          keys.forEach(key => {
            translations[key] = i18n.translations[key];
          });
        });
        const serialized = JSON.stringify({chunks, translations});
        const script = html`<script type='application/json' id="__TRANSLATIONS__">${
          serialized
        }</script>`; // consumed by ./browser
        ctx.body.body.push(script);
      } else if (ctx.path === '/_translations') {
        const i18n = this.of(ctx);
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
    },
  });
}
