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
import {Router, Route, NotFound} from '../server';

test('sets code', t => {
  const Hello = () => (
    <NotFound>
      <div>Hello</div>
    </NotFound>
  );
  const state = {code: 0};
  const ctx = {
    setCode(code) {
      state.code = code;
    },
  };
  const el = (
    <Router location="/" context={ctx}>
      <Route component={Hello} />
    </Router>
  );
  t.ok(/Hello/.test(render(el)), 'matches');
  t.equals(state.code, 404, 'sets code');
  t.end();
});
