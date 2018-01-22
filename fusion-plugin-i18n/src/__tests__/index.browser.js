/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import test from 'tape-cup';
import I18n from '../browser';

test('hydration', t => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${value}'},
  };
  const i18n = I18n.provides({hydrationState}).from();
  t.equals(i18n.translate('test'), 'hello');
  t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
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
  document.body.appendChild(translations);
  const i18n = I18n.provides({hydrationState}).from();
  t.equals(i18n.translate('test'), 'hello');
  t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
  document.body.removeChild(translations);
  t.end();
});

test('hydration parse error', t => {
  const translations = document.createElement('script');
  translations.setAttribute('type', 'application/json');
  translations.setAttribute('id', '__TRANSLATIONS__');
  translations.textContent = 'abcdomg-"asddf}';
  document.body.appendChild(translations);
  try {
    const plugin = I18n.provides();
    plugin.from();
  } catch (e) {
    t.equal(
      e.message,
      '[fusion-plugin-i18n] - Error parsing __TRANSLATIONS__ element content'
    );
  } finally {
    document.body.removeChild(translations);
    t.end();
  }
});

test('hydration missing element error', t => {
  try {
    const plugin = I18n.provides();
    plugin.from();
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
    translations: {},
  };
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  const fetch = (url, options) => {
    t.equals(url, '/_translations?ids=0', 'url is ok');
    t.equals(options.method, 'POST', 'method is ok');
    called = true;
    return Promise.resolve({json: () => data});
  };
  const plugin = I18n.provides({fetch, hydrationState});
  const i18n = plugin.from();
  i18n.load([0]).then(() => {
    t.ok(called, 'fetch called');
    t.equals(i18n.translate('test'), 'hello');
    t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
    t.end();
  });
});
