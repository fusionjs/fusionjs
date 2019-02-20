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

import {MemoryRouter, Route} from '../browser.js';

test('works in browser', t => {
  const root = document.createElement('div');

  const el = (
    <MemoryRouter initialEntries={['/test']}>
      <Route path="/test" render={() => <div>Test</div>} />
    </MemoryRouter>
  );
  ReactDOM.render(el, root);
  t.ok(/Test/.test(root.innerHTML), 'matches');
  t.end();
});
