// @flow

import React from 'react';
import {render} from '@testing-library/react';

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

  const {asFragment} = render(
    <I18nContext.Provider value={mockI18n}>
      <Foo />
    </I18nContext.Provider>
  );

  expect(asFragment()).toMatchSnapshot();
});
