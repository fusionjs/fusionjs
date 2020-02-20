// @flow

import React from 'react';
import {mount} from 'enzyme';

import {useTranslations} from '../src/index';
import {I18nContext} from '../src/plugin.js';

test('useTranslations() hook', () => {
  function Foo() {
    const translate = useTranslations();
    return <div>{translate('foo')}</div>;
  }

  const mockI18n = {
    async load() {},
    localeCode: 'fr_CA',
    translate(str) {
      return `${str} bar baz`;
    },
  };

  expect(
    mount(
      <I18nContext.Provider value={mockI18n}>
        <Foo />
      </I18nContext.Provider>
    ).html()
  ).toMatchSnapshot();
});
