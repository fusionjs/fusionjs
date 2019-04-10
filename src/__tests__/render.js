/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import * as React from 'react';
import {getSimulator} from 'fusion-test-utils';
import App from '../index';

test('custom render function', async t => {
  let didRender = false;
  const app = new App(React.createElement('span', null, 'hello'), (el, ctx) => {
    t.ok(el);
    t.ok(ctx);
    didRender = true;
    return 10;
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.ok(ctx.element);
  t.equal(ctx.rendered, 10);
  t.ok(didRender);
  t.end();
});
