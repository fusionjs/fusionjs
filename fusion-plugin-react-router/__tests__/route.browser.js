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
import {Router, Route} from '../src/browser';
import {createBrowserHistory} from 'history';

test('matches as expected', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
});
test('misses as expected', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route exact path="/bar" component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  expect(!/Hello/.test(root.innerHTML)).toBeTruthy();
});
test('support props.render', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" render={() => <Hello />} />
    </Router>
  );
  expect(() => {
    ReactDOM.render(el, root);
  }).not.toThrow();
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
});
test('support props.children as render prop', () => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  /* eslint-disable react/no-children-prop */
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" children={() => <Hello />} />
    </Router>
  );
  /* eslint-enable react/no-children-prop */
  expect(() => {
    ReactDOM.render(el, root);
  }).not.toThrow();
  expect(/Hello/.test(root.innerHTML)).toBeTruthy();
});
