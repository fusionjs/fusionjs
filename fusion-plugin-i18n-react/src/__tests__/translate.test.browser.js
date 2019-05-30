// @flow

import React from 'react';
import {mount} from 'enzyme';

import {Translate} from '../index';
import {I18nContext} from '../plugin.js';

test('Translate', () => {
  const Foo = () => {
    return (
      <div>
        <Translate id={'foo'} />
      </div>
    );
  };

  const mockI18n = {
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
