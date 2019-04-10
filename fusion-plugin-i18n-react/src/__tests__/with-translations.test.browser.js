// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';

import {withTranslations} from '../index';

function mockProvider(i18n) {
  class I18NProvider extends Component<*, *> {
    getChildContext() {
      return {i18n};
    }
    render() {
      return React.Children.only(this.props.children);
    }
  }

  I18NProvider.childContextTypes = {
    i18n: PropTypes.object.isRequired,
  };

  return I18NProvider;
}

test('withTranslations() HOC - localeCode', () => {
  const Foo = withTranslations([])(({localeCode, translate}) => {
    return (
      <div>
        {localeCode}
        {translate()}
      </div>
    );
  });

  const Provider = mockProvider({
    localeCode: 'fr_CA',
    translate() {
      return 'foo bar baz';
    },
  });

  expect(
    mount(
      <Provider>
        <Foo />
      </Provider>
    ).html()
  ).toMatchSnapshot();
});
