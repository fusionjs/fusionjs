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
import {Router, Route, Status} from '../src/browser';
import {createBrowserHistory} from 'history';

test('noops', () => {
  const root = document.createElement('div');
  const Hello = () => (
    <Status code="404">
      <div>Hello</div>
    </Status>
  );
  const el = (
    <Router history={createBrowserHistory()}>
      <Route component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
});
