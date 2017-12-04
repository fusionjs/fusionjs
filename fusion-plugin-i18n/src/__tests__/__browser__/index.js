/* eslint-env browser */
import test from 'tape-cup';
import I18n from '../../browser';

test('hydration', t => {
  const hydrationState = {
    chunks: [0],
    translations: {test: 'hello', interpolated: 'hi ${value}'},
  };
  const plugin = I18n({hydrationState});
  const i18n = plugin.of();
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
  const plugin = I18n();
  const i18n = plugin.of();
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
  const plugin = I18n();
  try {
    plugin.of();
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
  const plugin = I18n();
  try {
    plugin.of();
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
  const plugin = I18n({fetch, hydrationState});
  const i18n = plugin.of();
  i18n.load([0]).then(() => {
    t.ok(called, 'fetch called');
    t.equals(i18n.translate('test'), 'hello');
    t.equals(i18n.translate('interpolated', {value: 'world'}), 'hi world');
    t.end();
  });
});
