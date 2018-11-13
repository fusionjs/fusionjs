/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import React from 'react';
import {test, getSimulator} from 'fusion-test-utils';

import Plugin, {
  I18nToken,
  I18nLoaderToken,
  HydrationStateToken,
  createI18nLoader,
  Translate,
  withTranslations,
} from '../index.js';

test('exports', t => {
  t.ok(Plugin, 'exports default plugin');
  t.ok(I18nToken, 'exports I18nToken');
  t.ok(I18nLoaderToken, 'exports I18nLoaderToken');
  t.ok(HydrationStateToken, 'exports HydrationStateToken');
  t.ok(createI18nLoader, 'exports createI18nLoader');
  t.ok(Translate, 'exports Translate');
  t.ok(withTranslations, 'exports withTranslations');
});

test('plugin', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  function Test(props) {
    t.equal(typeof props.translate, 'function');
    return React.createElement(
      'div',
      null,
      React.createElement(Translate, {id: 'test'})
    );
  }
  const Root = withTranslations(['test'])(Test);
  const app = new App(React.createElement(Root));
  app.register(I18nToken, Plugin);
  app.register(
    I18nLoaderToken,
    createPlugin({
      provides() {
        return {from: () => ({translations: data, locale: 'en_US'})};
      },
    })
  );
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equal(translator.translate('test'), 'hello');
      t.equal(
        translator.translate('interpolated', {value: 'world'}),
        'hi world'
      );
      return next();
    };
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'));
});
