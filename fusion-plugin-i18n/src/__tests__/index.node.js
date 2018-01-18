/* eslint-env node */

import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import App, {consumeSanitizedHTML} from 'fusion-core';
import I18n, {I18nLoaderToken} from '../node';
import {I18nToken} from '../index';

test('translate', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const app = new App('el', el => el);
  app.register(I18nToken, I18n);
  app.register(I18nLoaderToken, () => ({translations: data, locale: 'en_US'}));
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equals(translator.translate('test'), 'hello');
      t.equals(
        translator.translate('interpolated', {value: 'world'}),
        'hi world'
      );
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
  t.end();
});

test('ssr', async t => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  // eslint-disable-next-line import/no-unresolved
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [0],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    element: 'test',
    template: {body: []},
    memoized: new Map(),
  };
  const deps = {
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  };
  const i18n = I18n.provides(deps);

  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.equals(ctx.template.body.length, 1, 'injects hydration code');
  t.equals(
    consumeSanitizedHTML(ctx.template.body[0]).match('hello')[0],
    'hello'
  );
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  // eslint-disable-next-line import/no-unresolved
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx = {
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en_US'},
    path: '/_translations',
    querystring: 'ids=0',
    memoized: new Map(),
  };

  const deps = {
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  };
  const i18n = I18n.provides(deps);
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
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

  const deps = {
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  };
  const i18n = I18n.provides(deps);
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.notok(ctx.body, 'does not set ctx.body');
  t.end();
});
