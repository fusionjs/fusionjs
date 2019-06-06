// @flow

import React from 'react';
import {mount} from 'enzyme';

import {useTranslations} from '../index';
import {I18nContext} from '../plugin.js';

test('useTranslations() hook', () => {
  function Foo() {
    const translate = useTranslations('foo');
    return <div>{translate()}</div>;
  }

  const mockI18n = {
    async load() {},
    localeCode: 'fr_CA',
    translate() {
      return 'foo bar baz';
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
