/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import * as React from 'react';
import {createToken, createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import App from '../index';
import {
  FusionContext,
  serviceContextPlugin,
  ServiceConsumer,
  useService,
} from '../context.js';

test('useService hook', async t => {
  const TestToken = createToken('test');
  const TestPlugin = createPlugin({provides: () => 3});
  let didRender = false;
  function TestComponent() {
    const provides = useService(TestToken);
    const ctx = React.useContext(FusionContext);
    didRender = true;
    t.equal(provides, 3, 'gets registered service');
    t.equal(ctx.request.url, '/', 'gets Fusion context');
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  app.register(TestToken, TestPlugin);
  app.register(serviceContextPlugin(app));
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});

test('context error', async t => {
  let didRender = false;
  function TestComponent() {
    const TestToken = createToken('test');
    const provides = useService(TestToken);
    didRender = true;
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  app.register(serviceContextPlugin(app));
  const sim = getSimulator(app);
  try {
    await sim.render('/');
  } catch (e) {
    t.ok(
      /Token not registered/.test(e.message),
      'throws when token not registered'
    );
  }
  t.notOk(didRender);
  t.end();
});

test('context consumer component', async t => {
  const TestToken = createToken('test');
  const TestPlugin = createPlugin({provides: () => 3});
  let didRender = false;
  function TestComponent() {
    return React.createElement(
      ServiceConsumer,
      {token: TestToken},
      provides => {
        didRender = true;
        t.equal(provides, 3, 'gets registered service');
        return React.createElement('div', null, 'hello');
      }
    );
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  app.register(TestToken, TestPlugin);
  app.register(serviceContextPlugin(app));
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});
