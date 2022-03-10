/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import {renderToString as render} from 'react-dom/server';

import {Router, NotFound} from '../src/server.js';
import {Routes, Route, Router as DefaultProvider} from 'react-router-dom';
import {createServerHistory} from '../src/modules/ServerHistory.js';

test('sets code', () => {
  const Hello = () => (
    <NotFound>
      <div>Hello</div>
    </NotFound>
  );
  const state = {code: 0};
  const ctx = {
    action: null,
    location: null,
    url: null,
    set status(code: number) {
      state.code = code;
    },
  };
  const history = createServerHistory('', ctx, '/');
  const el = (
    <Router context={ctx} history={history} Provider={DefaultProvider}>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(state.code).toBe(404);
});
