/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App from 'fusion-react';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';
import {Locale} from 'locale';

import Plugin, {I18nToken, I18nLoaderToken} from 'fusion-plugin-i18n-react';

import Root from './root.js';

// Translation details
const data = {test: 'hello ${value}'};
const locale = new Locale('en-US');

export default () => {
  const app = new App(Root);

  app.register(I18nToken, Plugin);
  __NODE__ &&
    app.register(I18nLoaderToken, {
      from: () => ({translations: data, locale: locale}),
    });
  __BROWSER__ && app.register(FetchToken, fetch);

  return app;
};
