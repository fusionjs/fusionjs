/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import test from 'tape-cup';
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route} from '../browser';

test('matches as expected', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router>
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
    <Router>
      <Route exact path="/bar" component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  t.ok(!/Hello/.test(root.innerHTML), 'does not render unmatched route');
  t.end();
});
