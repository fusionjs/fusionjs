/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Routes, Route, Navigate} from '../browser';
import {createBrowserHistory} from 'history';

test('test Navigate', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const Moved = () => <Navigate to="/hello" />;
  const history = createBrowserHistory();
  const el = (
    <Router history={history}>
      <Routes>
        <Route path="/" element={<Moved />} />
        <Route path="/hello" element={<Hello />} />
      </Routes>
    </Router>
  );
  // Render twice for hooks in react-router-dom to work in jsdom
  ReactDOM.render(el, root);
  ReactDOM.render(el, root);
  expect(window.location.pathname).toBe('/hello');
});
