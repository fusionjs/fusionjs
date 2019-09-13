/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import test from 'tape-cup';

import {getSimulator} from 'fusion-test-utils';
import App, {consumeSanitizedHTML} from 'fusion-core';
import type {Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import I18n, {matchesLiteralSections} from '../node';
import {I18nLoaderToken} from '../tokens.js';
import {I18nToken} from '../index';

test('translate', async t => {
  const data = {test: 'hello', interpolated: 'hi ${adjective} ${noun}'};
  const app = new App('el', el => el);
  app.register(I18nToken, I18n);
  app.register(I18nLoaderToken, {
    from: () => ({translations: data, locale: 'en_US'}),
  });
  // $FlowFixMe
  app.register(UniversalEventsToken, {
    from: () => ({
      emit: (name, payload) => {
        t.equals(
          name,
          'i18n-translate-miss',
          'emits event when translate key missing'
        );
        t.equals(
          payload.key,
          'missing-translation',
          'payload contains key for missing translation'
        );
      },
    }),
  });
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equals(translator.translate('test'), 'hello');
      t.equals(
        translator.translate('missing-translation'),
        'missing-translation',
        'fallsback to key'
      );
      t.equals(
        translator.translate('interpolated', {adjective: 'big', noun: 'world'}),
        'hi big world'
      );
      t.equals(
        translator.translate('interpolated', {noun: 'world'}),
        'hi ${adjective} world'
      );
      t.equals(
        translator.translate('interpolated', {adjective: '', noun: '0'}),
        'hi  0'
      );
      t.equals(translator.translate('interpolated'), 'hi ${adjective} ${noun}');
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
  t.end();
});

test('ssr', async t => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  /* eslint-disable import/no-unresolved */
  // $FlowFixMe
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  /* eslint-enable import/no-unresolved */
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx: Context = {
    syncChunks: [0],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    element: 'test',
    // $FlowFixMe - Invalid context
    template: {htmlAttrs: {}, body: []},
    memoized: new Map(),
  };
  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(4);
  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.equals(ctx.template.body.length, 1, 'injects hydration code');
  t.equals(
    // $FlowFixMe
    consumeSanitizedHTML(ctx.template.body[0]).match('hello')[0],
    'hello'
  );
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);
  t.equals(ctx.template.htmlAttrs['lang'], 'en-US');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  /* eslint-disable import/no-unresolved */
  // $FlowFixMe
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  /* eslint-enable import/no-unresolved */
  chunkTranslationMap.add('a.js', [0], Object.keys(data));
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en_US'},
    path: '/_translations',
    querystring: '',
    memoized: new Map(),
    request: {body: ['test', 'interpolated']},
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(3);

  ctx.set = (key, value) => {
    t.equals(key, 'cache-control', 'cache header set');
    t.equals(value, 'public, max-age=3600', 'cache translations for 1 hour');
  };

  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.deepEquals(ctx.body, data, 'injects hydration code');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint request handles empty body', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    set: () => {},
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en_US'},
    path: '/_translations',
    querystring: '',
    memoized: new Map(),
    request: {body: void 0},
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(2);

  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.pass("doesn't throw");
  t.deepEquals(ctx.body, {}, 'defaults to an empty set of translations');

  t.end();
});

test('endpoint request handles legacy query params', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    set: () => {},
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en_US'},
    path: '/_translations',
    querystring: 'keys=["test","interpolated"]',
    memoized: new Map(),
    request: {body: void 0},
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(2);

  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.pass("doesn't throw");
  t.deepEquals(ctx.body, {}, 'defaults to an empty set of translations');

  t.end();
});

test('non matched route', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    path: '/_something',
    memoized: new Map(),
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(1);
  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.notok(ctx.body, 'does not set ctx.body');
  t.end();
});

test('matchesLiteralSections matches positionally', async t => {
  function literalSections(quasis, ...substitutions) {
    return quasis;
  }

  const translations = [
    'cities.Buffalo',
    'cities.Chicago',
    'cities.LosAngeles',
    'animals.Buffalo',
    'animals.Cat',
    'test',
    'testend',
    'starttest',
  ];

  // handles ending matches
  const buffaloMatches = translations.filter(
    matchesLiteralSections(literalSections`${''}.Buffalo`)
  );
  t.deepEqual(buffaloMatches, ['cities.Buffalo', 'animals.Buffalo']);

  // handles beginning matches'
  const animalMatches = translations.filter(
    matchesLiteralSections(literalSections`animals.${''}`)
  );
  t.deepEqual(animalMatches, ['animals.Buffalo', 'animals.Cat']);

  const dotMatches = translations.filter(
    matchesLiteralSections(literalSections`${''}.${''}`)
  );
  t.deepEqual(dotMatches, [
    'cities.Buffalo',
    'cities.Chicago',
    'cities.LosAngeles',
    'animals.Buffalo',
    'animals.Cat',
  ]);

  // handles static matches
  const staticMatches = translations.filter(
    matchesLiteralSections(literalSections`test`)
  );
  t.deepEqual(staticMatches, ['test']);

  // handles multiple parts
  const matches1 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}a${''}o`)
  );
  t.deepEqual(matches1, ['cities.Buffalo', 'cities.Chicago']);

  // confines match to later parts in the string
  const matches2 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}A${''}o`)
  );
  t.deepEqual(matches2, []);

  const matches3 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}A${''}`)
  );
  t.deepEqual(matches3, ['cities.LosAngeles']);

  // doesn't overlap matches
  const matches4 = ['abc', 'abbc', 'ababc'].filter(
    matchesLiteralSections(literalSections`${''}ab${''}bc${''}`)
  );
  t.deepEqual(matches4, ['abbc', 'ababc']);

  t.end();
});
