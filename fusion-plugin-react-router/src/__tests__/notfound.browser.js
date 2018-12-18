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

import createBrowserHistory from 'history/createBrowserHistory';

import {Router, Route, NotFound} from '../browser.js';

test('noops', t => {
  const root = document.createElement('div');

  const Hello = () => (
    <NotFound>
      <div>Hello</div>
    </NotFound>
  );
  const el = (
    <Router history={createBrowserHistory()}>
      <Route component={Hello} />
    </Router>
  );
  ReactDOM.render(el, root);
  t.ok(/Hello/.test(root.innerHTML), 'matches');
  t.end();
});
