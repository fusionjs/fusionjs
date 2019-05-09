/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import test from 'tape-cup';

import type {Context} from 'fusion-core';

import I18n from '../browser';

test('hydration', t => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${adjective} ${noun}'},
  };
  t.plan(5);
  if (!I18n.provides) {
    t.end();
    return;
  }

  const mockContext: Context = ({}: any);
  const i18n = I18n.provides({hydrationState}).from(mockContext);
  t.equals(i18n.translate('test'), 'hello');
  t.equals(
    i18n.translate('interpolated', {adjective: 'big', noun: 'world'}),
    'hi big world'
  );
  t.equals(
    i18n.translate('interpolated', {noun: 'world'}),
    'hi ${adjective} world'
  );
  t.equals(i18n.translate('interpolated', {adjective: '', noun: '0'}), 'hi  0');
  t.equals(i18n.translate('interpolated'), 'hi ${adjective} ${noun}');
  t.end();
});

test('hydration from element', t => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${value}'},
  };
  const translations = document.createElement('script');
  translations.setAttribute('type', 'application/json');
  translations.setAttribute('id', '__TRANSLATIONS__');
  translations.textContent = JSON.stringify(hydrationState);
  document.body && document.body.appendChild(translations);

  t.plan(2);
  if (!I18n.provides) {
    t.end();
    return;
  }

  const mockContext: Context = ({}: any);
  const i18n = I18n.provides({hydrationState}).from(mockContext);
  t.equals(i18n.translate('test'), 'hello');
  t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
  document.body && document.body.removeChild(translations);
  t.end();
});

test('hydration parse error', t => {
  const translations = document.createElement('script');
  translations.setAttribute('type', 'application/json');
  translations.setAttribute('id', '__TRANSLATIONS__');
  translations.textContent = 'abcdomg-"asddf}';
  document.body && document.body.appendChild(translations);

  t.plan(1);
  if (!I18n.provides) {
    t.end();
    return;
  }

  try {
    const mockContext: Context = ({}: any);
    const plugin = I18n.provides({});
    plugin.from(mockContext);
  } catch (e) {
    t.equal(
      e.message,
      '[fusion-plugin-i18n] - Error parsing __TRANSLATIONS__ element content'
    );
  } finally {
    document.body && document.body.removeChild(translations);
    t.end();
  }
});

test('hydration missing element error', t => {
  t.plan(1);
  if (!I18n.provides) {
    t.end();
    return;
  }

  try {
    const mockContext: Context = ({}: any);
    const plugin = I18n.provides({});
    plugin.from(mockContext);
  } catch (e) {
    t.equal(
      e.message,
      '[fusion-plugin-i18n] - Could not find a __TRANSLATIONS__ element'
    );
  } finally {
    t.end();
  }
});

test('load', t => {
  let called = false;
  const hydrationState = {
    chunks: [],
    localeCode: 'es-MX',
    translations: {},
  };
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const fetch: any = (url, options) => {
    t.equals(url, '/_translations?keys=test-key', 'url is ok');
    t.equals(options && options.method, 'POST', 'method is ok');
    t.equals(
      options && options.headers && options.headers['X-Fusion-Locale-Code'],
      'es-MX',
      'locale code header is ok'
    );
    called = true;
    return Promise.resolve({json: () => data});
  };
  const plugin = I18n.provides && I18n.provides({fetch, hydrationState});
  const mockContext: Context = ({}: any);
  if (plugin) {
    const i18n = plugin.from(mockContext);
    i18n.load(['test-key']).then(() => {
      t.ok(called, 'fetch called');
      t.equals(i18n.translate('test'), 'hello');
      t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
      t.ok(i18n.translations && !('test-key' in i18n.translations));
      t.end();
    });
  } else {
    t.fail();
  }
});
