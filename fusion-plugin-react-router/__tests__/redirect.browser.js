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
import {Router, Route, Redirect} from '../src/browser';
import {createBrowserHistory} from 'history';

test('test Redirect', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const Moved = () => <Redirect to="/hello">Hi</Redirect>;
  const el = (
    <Router history={createBrowserHistory()}>
      <div>
        <Route path="/" component={Moved} />
        <Route path="/hello" component={Hello} />
      </div>
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
  expect(window.location.pathname).toBe('/hello');

  // reset the url back to "/"
  ReactDOM.render(
    <Router history={createBrowserHistory()}>
      <Redirect to="/" />
    </Router>,
    document.createElement('div')
  );
});
