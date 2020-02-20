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
import {Router, Switch, Route} from '../src/browser';
import {createBrowserHistory} from 'history';

test('matches as expected', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Switch>
        <Route path="/" component={Hello} />
        <Route path="/" component={Hi} />
      </Switch>
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
  expect(!/Hi/.test(root.innerHTML)).toBeTruthy();
});
