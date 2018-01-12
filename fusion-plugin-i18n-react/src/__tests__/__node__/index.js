/* eslint-env node */

import test from 'tape-cup';
import Plugin from '../../plugin';
import withI18n from '../../hoc';

test('plugin', t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  t.equals(typeof Plugin, 'function');

  const I18n = Plugin({
    loadTranslations: () => ({translations: data, locale: 'en-US'}),
  });
  const ctx = {headers: {'accept-language': 'en-US'}, memoized: new Map()};
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
