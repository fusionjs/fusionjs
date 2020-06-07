/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';

import {createBrowserHistory} from 'history';

import {Router, Route, NotFound} from '../src/browser.js';

test('noops', () => {
  const root = document.createElement('div');

  const Hello = () => (
    <NotFound>
      <div>Hello</div>
    </NotFound>
  );
  const el = (
    <Router history={createBrowserHistory()}>
      <Route component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
});
