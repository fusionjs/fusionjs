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
import {Router, Routes, Route} from '../src/browser';
import {createBrowserHistory} from 'history';

test('routes matches as expected', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/" element={<Hi />} />
      </Routes>
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
  expect(!/Hi/.test(root.innerHTML)).toBeTruthy();
});

test('routes fires onRoute when location changes', (done) => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;

  const onRoute = (data) => {
    expect(data.page).toEqual('/hello');
    expect(data.title).toEqual('/hello');
    expect(data.params).toEqual({});
    done();
  };

  const history = createBrowserHistory();
  history.replace('/hello');

  const el = (
    <Router history={history} onRoute={onRoute}>
      <Routes>
        <Route path="/hello" element={<Hello />} />
      </Routes>
    </Router>
  );
  ReactDOM.render(el, root);
});
