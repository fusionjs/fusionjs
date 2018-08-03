/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route} from '../browser';
import createBrowserHistory from 'history/createBrowserHistory';

test('matches as expected', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  t.ok(/Hello/.test(root.innerHTML), 'renders matched route');
  t.end();
});
test('misses as expected', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route exact path="/bar" component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  t.ok(!/Hello/.test(root.innerHTML), 'does not render unmatched route');
  t.end();
});
test('support props.render', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" render={() => <Hello />} />
    </Router>
  );
  t.doesNotThrow(() => {
    ReactDOM.render(el, root);
  }, 'does not throw when passing props.render');
  t.ok(/Hello/.test(root.innerHTML), 'renders matched route');
  t.end();
});
test('support props.children as render prop', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  /* eslint-disable react/no-children-prop */
  const el = (
    <Router history={createBrowserHistory()}>
      <Route path="/" children={() => <Hello />} />
    </Router>
  );
  /* eslint-enable react/no-children-prop */
  t.doesNotThrow(() => {
    ReactDOM.render(el, root);
  }, 'does not throw when passing props.children as function to <Route>');
  t.ok(/Hello/.test(root.innerHTML), 'renders matched route');
  t.end();
});
