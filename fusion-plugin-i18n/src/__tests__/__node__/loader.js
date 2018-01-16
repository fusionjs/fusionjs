/* eslint-env node */

import fs from 'fs';
import test from 'tape-cup';
import I18n from '../../node';
import createLoader from '../../loader';

test('loader', async t => {
  fs.mkdirSync('translations');
  fs.writeFileSync('translations/en-US.json', '{"test": "hi ${value}"}');

  const ctx = {
    headers: {'accept-language': 'en-US'},
    memoized: new Map(),
  };

  const i18n = I18n({
    loadTranslations: createLoader({headers: {'accept-language': 'en-US'}}),
  }).of(ctx);
  t.equals(i18n.translate('test', {value: 'world'}), 'hi world');

  fs.unlinkSync('translations/en-US.json');
  fs.rmdirSync('translations');

  t.end();
});

test('no translations dir', t => {
  t.doesNotThrow(createLoader);
  t.end();
});
