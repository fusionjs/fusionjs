// @flow

import React from 'react';
import {render} from '@testing-library/react';

import {Translate} from '../src/index';
import {I18nContext} from '../src/plugin.js';

test('Translate', () => {
  const Foo = () => {
    return (
      <div>
        <Translate id={'foo'} />
      </div>
    );
  };

  const mockI18n = {
    async load() {},
    localeCode: 'fr_CA',
    translate() {
      return 'foo bar baz';
    },
  };

  const {asFragment} = render(
    <I18nContext.Provider value={mockI18n}>
      <Foo />
    </I18nContext.Provider>
  );

  expect(asFragment()).toMatchSnapshot();
});
