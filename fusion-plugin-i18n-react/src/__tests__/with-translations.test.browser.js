// @flow

import React from 'react';
import {mount} from 'enzyme';

import {withTranslations} from '../index';
import {I18nContext} from '../plugin.js';

test('withTranslations() HOC - localeCode', () => {
  const Foo = withTranslations([])(({localeCode, translate}) => {
    return (
      <div>
        {localeCode}
        {translate()}
      </div>
    );
  });

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
