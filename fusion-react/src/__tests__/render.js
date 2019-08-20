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
import App, {SkipPrepareToken} from '../index';
import prepared from '../async/prepared';

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

test('runs prepare', async t => {
  let called = false;
  const Root = prepared(() => {
    called = true;
    return Promise.resolve();
  })(() => {
    return React.createElement('span', null, 'hello');
  });
  const app = new App(React.createElement(Root), () => {
    t.equal(called, true, 'calls prepass by default');
    t.end();
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
});

test('skip prepare', async t => {
  const Root = prepared(() => {
    t.fail('Should not call this');
    return Promise.resolve();
  })(() => {
    return React.createElement('span', null, 'hello');
  });
  const app = new App(React.createElement(Root), () => {
    t.end();
  });
  app.register(SkipPrepareToken, true);
  const simulator = getSimulator(app);
  await simulator.render('/');
});
