// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';

import {withTranslations} from '../index';
import {I18nContext} from '../plugin.js'

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
