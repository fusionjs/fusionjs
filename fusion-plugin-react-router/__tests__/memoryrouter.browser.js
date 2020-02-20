/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';

import {MemoryRouter, Route} from '../src/browser.js';

test('works in browser', () => {
  const root = document.createElement('div');

  const el = (
    <MemoryRouter initialEntries={['/test']}>
      <Route path="/test" render={() => <div>Test</div>} />
    </MemoryRouter>
  );
  ReactDOM.render(el, root);
  expect(/Test/.test(root.innerHTML)).toBeTruthy();
});
