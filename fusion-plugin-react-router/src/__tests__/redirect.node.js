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
import {Router, Route, Redirect} from '../server';

test('redirects to a new URL', t => {
  const Hello = () => <div>Hello</div>;
  const Moved = () => <Redirect to="/hello" />;
  let setCode = false;
  let didRedirect = false;
  const state = {
    setCode: code => {
      t.equal(code, 307);
      setCode = true;
    },
    redirect: to => {
      t.equal(to, '/hello');
      didRedirect = true;
    },
  };
  const ctx = state;
  const el = (
    <Router location="/" context={ctx}>
      <div>
        <Route path="/" component={Moved} />
        <Route path="/hello" component={Hello} />
      </div>
    </Router>
  );
  render(el);
  t.ok(setCode);
  t.ok(didRedirect);
  t.end();
});
