/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Route} from '../src/server';
import {createServerHistory} from '../src/modules/ServerHistory';

test('matches as expected', () => {
  const Hello = () => <div>Hello</div>;
  const ctx = {
    action: null,
    location: null,
    url: null,
  };
  const history = createServerHistory('/', ctx, '/');
  const el = (
    <Router history={history}>
      <Route path="/" component={Hello} />
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
});
test('misses as expected', () => {
  const Hello = () => <div>Hello</div>;
  const ctx = {
    action: null,
    location: null,
    url: null,
  };
  const history = createServerHistory('/', ctx, '/foo');
  const el = (
    <Router history={history}>
      <Route path="/bar" component={Hello} />
    </Router>
  );
  expect(!/Hello/.test(render(el))).toBeTruthy();
});
test('support props.render', () => {
  const ctx = {
    action: null,
    location: null,
    url: null,
  };
  const history = createServerHistory('/', ctx, '/');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router history={history}>
      <Route path="/" render={() => <Hello />} />
    </Router>
  );
  expect(() => /Hello/.test(render(el))).not.toThrow();
  expect(/Hello/.test(render(el))).toBeTruthy();
});
test('support props.children as render prop', () => {
  const ctx = {
    action: null,
    location: null,
    url: null,
  };
  const history = createServerHistory('/', ctx, '/');
  const Hello = () => <div>Hello</div>;
  /* eslint-disable react/no-children-prop */
  const el = (
    <Router history={history}>
      <Route path="/" children={() => <Hello />} />
    </Router>
  );
  /* eslint-enable react/no-children-prop */
  expect(() => /Hello/.test(render(el))).not.toThrow();
  expect(/Hello/.test(render(el))).toBeTruthy();
});
