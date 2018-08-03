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
import {Router, Switch, Route} from '../browser';
import createBrowserHistory from 'history/createBrowserHistory';

test('matches as expected', t => {
  const root = document.createElement('div');
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  const el = (
    <Router history={createBrowserHistory()}>
      <Switch>
        <Route path="/" component={Hello} />
        <Route path="/" component={Hi} />
      </Switch>
    </Router>
  );
  ReactDOM.render(el, root);
  t.ok(/Hello/.test(root.innerHTML), 'matches first');
  t.ok(!/Hi/.test(root.innerHTML), 'does not match second');
  t.end();
});
