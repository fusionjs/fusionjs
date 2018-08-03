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
import {Router, Switch, Route} from '../server';
import {createServerHistory} from '../modules/ServerHistory';

test('matches as expected', t => {
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  const ctx = {
    action: null,
    location: null,
    url: null,
  };
  const history = createServerHistory('/', ctx, '/');
  const el = (
    <Router history={history}>
      <Switch>
        <Route path="/" component={Hello} />
        <Route path="/" component={Hi} />
      </Switch>
    </Router>
  );
  t.ok(/Hello/.test(render(el)), 'matches first');
  t.ok(!/Hi/.test(render(el)), 'does not match second');
  t.end();
});
