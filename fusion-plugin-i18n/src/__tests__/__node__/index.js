/* eslint-env node */

import test from 'tape-cup';
import {consumeSanitizedHTML} from 'fusion-core';
import I18n from '../../node';

test('translate', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  const ctx = {
    headers: {'accept-language': 'en-US'},
    memoized: new Map(),
  };

  const i18n = I18n({
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  }).of(ctx);
  t.equals(i18n.translate('test'), 'hello');
  t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');

  t.end();
});

test('ssr', async t => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [0],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    element: 'test',
    body: {body: []},
    memoized: new Map(),
  };

  const i18n = I18n({
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  });
  await i18n.__middleware__(ctx, () => Promise.resolve());
  t.equals(ctx.body.body.length, 1, 'injects hydration code');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('hello')[0], 'hello');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('</div>'), null);

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    path: '/_translations',
    querystring: 'ids=0',
    memoized: new Map(),
  };

  const i18n = I18n({
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  });
  await i18n.__middleware__(ctx, () => Promise.resolve());
  t.deepEquals(ctx.body, data, 'injects hydration code');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('non matched route', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const ctx = {
    path: '/_something',
    memoized: new Map(),
  };
  const i18n = I18n({
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  });
  await i18n.__middleware__(ctx, () => Promise.resolve());
  t.notok(ctx.body, 'does not set ctx.body');
  t.end();
});
