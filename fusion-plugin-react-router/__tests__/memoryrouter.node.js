/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import {renderToString as render} from 'react-dom/server';

import {MemoryRouter, Route} from '../src/server.js';

test('works in server', () => {
  const el = (
    <MemoryRouter initialEntries={['/test']}>
      <Route path="/test" render={() => <div>Test</div>} />
    </MemoryRouter>
  );
  expect(/Test/.test(render(el))).toBeTruthy();
});
