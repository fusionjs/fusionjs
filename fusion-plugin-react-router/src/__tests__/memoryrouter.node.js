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

import {MemoryRouter, Route} from '../server.js';

test('works in server', t => {
  const el = (
    <MemoryRouter initialEntries={['/test']}>
      <Route path="/test" render={() => <div>Test</div>} />
    </MemoryRouter>
  );
  t.ok(/Test/.test(render(el)), 'matches');
  t.end();
});
