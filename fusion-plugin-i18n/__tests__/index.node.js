/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {getSimulator} from 'fusion-test-utils';
import App, {consumeSanitizedHTML} from 'fusion-core';
import type {Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import I18n from '../src/node';
import {matchesLiteralSections} from '../src/translate'
import {I18nLoaderToken} from '../src/tokens.js';
import {I18nToken} from '../src/index';

test('translate', async () => {
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
        expect(name).toBe('i18n-translate-miss');
        expect(payload.key).toBe('missing-translation');
      },
    }),
  });
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      expect(translator.translate('test')).toBe('hello');
      expect(translator.translate('missing-translation')).toBe(
        'missing-translation'
      );
      expect(
        translator.translate('interpolated', {
          adjective: 'big',
          noun: 'world',
        })
      ).toBe('hi big world');
      expect(translator.translate('interpolated', {noun: 'world'})).toBe(
        'hi ${adjective} world'
      );
      expect(
        translator.translate('interpolated', {adjective: '', noun: '0'})
      ).toBe('hi  0');
      expect(translator.translate('interpolated')).toBe(
        'hi ${adjective} ${noun}'
      );
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
});

test('ssr', async done => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  const chunkTranslationMap = require('../chunk-translation-map');
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

  expect.assertions(4);
  if (!I18n.provides) {
    done();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    done();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  expect(ctx.template.body.length).toBe(1);
  expect(
    // $FlowFixMe
    consumeSanitizedHTML(ctx.template.body[0]).match('hello')[0]
  ).toBe('hello');
  expect(consumeSanitizedHTML(ctx.template.body[0]).match('</div>')).toBe(null);
  expect(ctx.template.htmlAttrs.lang).toBe('en-US');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  done();
});

test('endpoint', async done => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  const chunkTranslationMap = require('../chunk-translation-map');

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

  expect.assertions(3);

  ctx.set = (key, value) => {
    expect(key).toBe('cache-control');
    expect(value).toBe('public, max-age=3600');
  };

  if (!I18n.provides) {
    done();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    done();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  expect(ctx.body).toEqual(data);

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  done();
});

test('endpoint request handles empty body', async done => {
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

  expect.assertions(1);

  if (!I18n.provides) {
    done();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    done();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());

  expect(ctx.body).toEqual({});
  done();
});

test('endpoint request handles legacy query params', async done => {
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

  expect.assertions(1);

  if (!I18n.provides) {
    done();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    done();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  expect(ctx.body).toEqual({});
  done();
});

test('non matched route', async done => {
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

  expect.assertions(1);
  if (!I18n.provides) {
    done();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    done();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  expect(ctx.body).toBeFalsy();
  done();
});

test('matchesLiteralSections matches positionally', async () => {
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
  expect(buffaloMatches).toEqual(['cities.Buffalo', 'animals.Buffalo']);

  // handles beginning matches'
  const animalMatches = translations.filter(
    matchesLiteralSections(literalSections`animals.${''}`)
  );
  expect(animalMatches).toEqual(['animals.Buffalo', 'animals.Cat']);

  const dotMatches = translations.filter(
    matchesLiteralSections(literalSections`${''}.${''}`)
  );
  expect(dotMatches).toEqual([
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
  expect(staticMatches).toEqual(['test']);

  // handles multiple parts
  const matches1 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}a${''}o`)
  );
  expect(matches1).toEqual(['cities.Buffalo', 'cities.Chicago']);

  // confines match to later parts in the string
  const matches2 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}A${''}o`)
  );
  expect(matches2).toEqual([]);

  const matches3 = translations.filter(
    matchesLiteralSections(literalSections`${''}citi${''}s.${''}A${''}`)
  );
  expect(matches3).toEqual(['cities.LosAngeles']);

  // doesn't overlap matches
  const matches4 = ['abc', 'abbc', 'ababc'].filter(
    matchesLiteralSections(literalSections`${''}ab${''}bc${''}`)
  );
  expect(matches4).toEqual(['abbc', 'ababc']);
});
