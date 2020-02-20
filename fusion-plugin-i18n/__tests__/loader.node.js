/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import fs from 'fs';

import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import I18n from '../src/node';
import createLoader from '../src/loader';
import {createI18nLoader, I18nLoaderToken, I18nToken} from '../src/index.js';

test('loader', async () => {
  fs.mkdirSync('translations');
  fs.writeFileSync('translations/en_US.json', '{"test": "hi ${value}"}');

  const app = new App('el', el => el);
  app.register(I18nToken, I18n);
  // $FlowFixMe
  app.register(UniversalEventsToken, {
    from: () => ({emit: () => {}}),
  });
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      expect(translator.translate('test', {value: 'world'})).toBe('hi world');
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
  fs.unlinkSync('translations/en_US.json');
  fs.rmdirSync('translations');
});

test('custom locale resolver', async () => {
  fs.mkdirSync('translations');
  fs.writeFileSync('translations/en_US.json', '{"foo": "bar"}');
  fs.writeFileSync('translations/custom_US.json', '{"foo": "qux"}');

  const app = new App('el', el => el);
  app.register(
    I18nLoaderToken,
    createI18nLoader(ctx => 'custom_US')
  );
  app.register(I18nToken, I18n);
  // $FlowFixMe
  app.register(UniversalEventsToken, {
    from: () => ({emit: () => {}}),
  });
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      expect(translator.translate('foo')).toBe('qux');
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/', {headers: {'accept-language': 'en_US'}});
  fs.unlinkSync('translations/en_US.json');
  fs.unlinkSync('translations/custom_US.json');
  fs.rmdirSync('translations');
});

test('no translations dir', () => {
  expect(createLoader).not.toThrow();
});
