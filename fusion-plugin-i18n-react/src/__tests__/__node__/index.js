/* eslint-env node */

import test from 'tape-cup';
import Plugin from '../../plugin';
import withI18n from '../../hoc';

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

test('plugin', t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  const TranslationsLoader = getTranslationsLoader(data, 'en-US');

  t.equals(typeof Plugin, 'function');

  const I18n = Plugin({TranslationsLoader});
  const ctx = {headers: {'accept-language': 'en-US'}};
  t.equals(typeof I18n.of(ctx).translate, 'function');
  t.end();
});
test('hoc', t => {
  function Test() {}
  const hoc = withI18n(Test);
  t.equals(typeof withI18n, 'function');
  t.equals(hoc.displayName, 'WithI18n(Test)');
  t.end();
});
