/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import test from 'tape-cup';
import HelmetPlugin from '../index.js';

test('Non render request', async t => {
  const app = new App(React.createElement('div'), el => el);
  app.register(HelmetPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.request('/');
  t.equal(ctx.element, null, 'does not wrap ctx.element');
  t.end();
});

test('Render request with server side redirect', async t => {
  const app = new App(React.createElement('div'), el => el);
  app.register(HelmetPlugin);
  app.middleware((ctx, next) => {
    ctx.redirect('/test');
    return next();
  });
  const sim = getSimulator(app);
  await sim.render('/');
  t.end();
});
