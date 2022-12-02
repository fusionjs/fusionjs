/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Routes, Route, Status} from '../server';
import {createServerHistory} from '../modules/ServerHistory';

test('status server sets code with static code', () => {
  const Hello = () => (
    <Status code="404">
      <div>Hello</div>
    </Status>
  );
  const state = {code: 0};
  const ctx = {
    action: null,
    location: null,
    url: null,
    set status(code) {
      state.code = code;
    },
  };
  const history = createServerHistory('', ctx, '/');
  const el = (
    <Router history={history} context={ctx}>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(state.code).toBe(404);
});

test('status server sets code with numeric code', () => {
  const Hello = () => (
    <Status code={404}>
      <div>Hello</div>
    </Status>
  );
  const state = {code: 0};
  const ctx = {
    action: null,
    location: null,
    url: null,
    set status(code) {
      state.code = code;
    },
  };
  const history = createServerHistory('', ctx, '/');
  const el = (
    <Router history={history} context={ctx}>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(state.code).toBe(404);
});

test('status server sets code with string code', () => {
  const Hello = () => (
    <Status code={'404'}>
      <div>Hello</div>
    </Status>
  );
  const state = {code: 0};
  const ctx = {
    action: null,
    location: null,
    url: null,
    set status(code) {
      state.code = code;
    },
  };
  const history = createServerHistory('', ctx, '/');
  const el = (
    <Router history={history} context={ctx}>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(state.code).toBe(404);
});
