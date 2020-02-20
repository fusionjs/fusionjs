/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Route, Redirect} from '../src/server';
import {createServerHistory} from '../src/modules/ServerHistory';

test('redirects to a new URL', () => {
  const Hello = () => <div>Hello</div>;
  const Moved = () => <Redirect to="/hello" />;
  let setCode = false;
  let didRedirect = false;
  const ctx = {
    action: null,
    location: null,
    set status(code) {
      expect(code).toBe(307);
      setCode = true;
    },
    set url(to) {
      expect(to).toBe('/hello');
      didRedirect = true;
    },
  };
  const history = createServerHistory('/', ctx, '/');
  const el = (
    <Router history={history} context={ctx}>
      <div>
        <Route path="/" component={Moved} />
        <Route path="/hello" component={Hello} />
      </div>
    </Router>
  );
  render(el);
  expect(setCode).toBeTruthy();
  expect(didRedirect).toBeTruthy();
});

test('redirects with deprecated context', () => {
  const Hello = () => <div>Hello</div>;
  const Moved = () => <Redirect to="/hello" />;
  let setCode = false;
  let didRedirect = false;
  const ctx = {
    action: null,
    location: null,
    setCode(code) {
      expect(code).toBe(307);
      setCode = true;
    },
    redirect(to) {
      expect(to).toBe('/hello');
      didRedirect = true;
    },
  };
  const history = createServerHistory('/', ctx, '/');
  const el = (
    <Router history={history} context={ctx}>
      <div>
        <Route path="/" component={Moved} />
        <Route path="/hello" component={Hello} />
      </div>
    </Router>
  );
  render(el);
  expect(setCode).toBeTruthy();
  expect(didRedirect).toBeTruthy();
});
