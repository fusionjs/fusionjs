/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import type {Context} from 'fusion-core';

import I18n from '../src/browser';

test('hydration', done => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${adjective} ${noun}'},
  };
  expect.assertions(8);
  if (!I18n.provides) {
    done();
    return;
  }

  const mockContext: Context = ({}: any);
  // $FlowFixMe
  const events = {
    emit: (name, payload) => {
      expect(name).toBe('i18n-translate-miss');
      const key = payload && typeof payload === 'object' && payload.key;
      expect(key).toBe('missing-browser-translation');
    },
  };

  const i18n = I18n.provides({hydrationState, events}).from(mockContext);
  expect(i18n.translate('test')).toBe('hello');
  expect(i18n.translate('missing-browser-translation')).toBe(
    'missing-browser-translation'
  );
  expect(
    i18n.translate('interpolated', {adjective: 'big', noun: 'world'})
  ).toBe('hi big world');
  expect(i18n.translate('interpolated', {noun: 'world'})).toBe(
    'hi ${adjective} world'
  );
  expect(i18n.translate('interpolated', {adjective: '', noun: '0'})).toBe(
    'hi  0'
  );
  expect(i18n.translate('interpolated')).toBe('hi ${adjective} ${noun}');
  done();
});

test('hydration from element', done => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${value}'},
  };
  const translations = document.createElement('script');
  translations.setAttribute('type', 'application/json');
  translations.setAttribute('id', '__TRANSLATIONS__');
  translations.textContent = JSON.stringify(hydrationState);
  document.body && document.body.appendChild(translations);

  expect.assertions(2);
  if (!I18n.provides) {
    done();
    return;
  }

  const mockContext: Context = ({}: any);
  const i18n = I18n.provides({hydrationState}).from(mockContext);
  expect(i18n.translate('test')).toBe('hello');
  expect(i18n.translate('interpolated', {value: 'world'})).toBe('hi world');
  document.body && document.body.removeChild(translations);
  done();
});

test('hydration parse error', done => {
  const translations = document.createElement('script');
  translations.setAttribute('type', 'application/json');
  translations.setAttribute('id', '__TRANSLATIONS__');
  translations.textContent = 'abcdomg-"asddf}';
  document.body && document.body.appendChild(translations);

  expect.assertions(1);
  if (!I18n.provides) {
    done();
    return;
  }

  const mockContext: Context = ({}: any);
  expect(() => {
    // $FlowFixMe
    const plugin = I18n.provides({});
    plugin.from(mockContext);
  }).toThrowError(
    '[fusion-plugin-i18n] - Error parsing __TRANSLATIONS__ element content'
  );
  document.body && document.body.removeChild(translations);
  done();
});

test('hydration missing element error', done => {
  expect.assertions(1);
  if (!I18n.provides) {
    done();
    return;
  }

  const mockContext: Context = ({}: any);
  expect(() => {
    // $FlowFixMe
    const plugin = I18n.provides({});
    plugin.from(mockContext);
  }).toThrowError(
    '[fusion-plugin-i18n] - Could not find a __TRANSLATIONS__ element'
  );
  done();
});

test('load', done => {
  let called = false;
  const hydrationState = {
    chunks: [],
    localeCode: 'es-MX',
    translations: {},
  };
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const fetch: any = (url, options) => {
    expect(url).toBe('/_translations?localeCode=es-MX');
    expect(options.body).toBe('["test-key"]');
    expect(options && options.method).toBe('POST');
    expect(
      options && options.headers && options.headers['X-Fusion-Locale-Code']
    ).toBe('es-MX');
    expect(options && options.method).toBe('POST');
    called = true;
    return Promise.resolve({json: () => data});
  };
  const plugin = I18n.provides && I18n.provides({fetch, hydrationState});
  const mockContext: Context = ({}: any);
  if (plugin) {
    const i18n = plugin.from(mockContext);
    i18n.load(['test-key']).then(() => {
      expect(called).toBeTruthy();
      expect(i18n.translate('test')).toBe('hello');
      expect(i18n.translate('interpolated', {value: 'world'})).toBe('hi world');
      expect(
        i18n.translations && !('test-key' in i18n.translations)
      ).toBeTruthy();
      done();
    });
  } else {
    // $FlowFixMe
    done.fail();
  }
});
