/* eslint-env node */

import test from 'tape-cup';
import {consumeSanitizedHTML} from 'fusion-core';
import I18n from '../../node';

function getTranslationsLoader(translations, locale) {
  return {
    of() {
      return {
        translations,
        locale,
      };
    },
  };
}

test('translate', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  const ctx = {
    headers: {'accept-language': 'en-US'},
  };

  const TranslationsLoader = getTranslationsLoader(data, 'en-US');

  const plugin = I18n({TranslationsLoader});
  const i18n = plugin.of(ctx);
  t.equals(i18n.translate('test'), 'hello');
  t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');

  t.end();
});

test('ssr', async t => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  const TranslationsLoader = getTranslationsLoader(data, 'en-US');

  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [0],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    element: 'test',
    body: {body: []},
  };

  const plugin = I18n({TranslationsLoader});
  await plugin.middleware(ctx, () => Promise.resolve());
  t.equals(ctx.body.body.length, 1, 'injects hydration code');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('hello')[0], 'hello');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('</div>'), null);

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const TranslationsLoader = getTranslationsLoader(data, 'en-US');

  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    path: '/_translations',
    querystring: 'ids=0',
  };

  const plugin = I18n({TranslationsLoader});
  await plugin.middleware(ctx, () => Promise.resolve());
  t.deepEquals(ctx.body, data, 'injects hydration code');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});
