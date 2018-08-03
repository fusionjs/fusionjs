/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Route} from '../server';
import {createServerHistory} from '../modules/ServerHistory';

test('matches as expected', t => {
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
  t.ok(/Hello/.test(render(el)), 'renders matched route in server');
  t.end();
});
test('misses as expected', t => {
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
  t.ok(!/Hello/.test(render(el)), 'does not render unmatched route');
  t.end();
});
test('support props.render', t => {
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
  t.doesNotThrow(
    () => /Hello/.test(render(el)),
    'does not throw when passing props.render'
  );
  t.ok(/Hello/.test(render(el)), 'renders matched route in server');
  t.end();
});
test('support props.children as render prop', t => {
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
  t.doesNotThrow(
    () => /Hello/.test(render(el)),
    'does not throw when passing props.children as function to <Route>'
  );
  t.ok(/Hello/.test(render(el)), 'renders matched route in server');
  t.end();
});
