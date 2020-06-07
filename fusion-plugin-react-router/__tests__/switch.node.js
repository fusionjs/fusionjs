/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Switch, Route} from '../src/server';
import {createServerHistory} from '../src/modules/ServerHistory';

test('matches as expected', () => {
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
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(!/Hi/.test(render(el))).toBeTruthy();
});
