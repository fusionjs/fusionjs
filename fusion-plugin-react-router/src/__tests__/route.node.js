/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Route} from '../server';

test('matches as expected', t => {
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router location="/">
      <Route path="/" component={Hello} />
    </Router>
  );
  t.ok(/Hello/.test(render(el)), 'renders matched route in server');
  t.end();
});
test('misses as expected', t => {
  const Hello = () => <div>Hello</div>;
  const el = (
    <Router location="/foo">
      <Route path="/bar" component={Hello} />
    </Router>
  );
  t.ok(!/Hello/.test(render(el)), 'does not render unmatched route');
  t.end();
});
