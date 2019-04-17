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
  ServiceConsumer,
  useService,
  withServices,
} from '../context.js';

test('context#useService', async t => {
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
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});

test('context#useService - unregistered token', async t => {
  let didRender = false;
  function TestComponent() {
    const TestToken = createToken('test');
    useService(TestToken);
    didRender = true;
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  const sim = getSimulator(app);
  try {
    await sim.render('/');
  } catch (e) {
    t.ok(
      /Token .* not registered/.test(e.message),
      'throws when token not registered'
    );
  }
  t.notOk(didRender);
  t.end();
});

test('context#useService - optional token', async t => {
  let didRender = false;
  function TestComponent() {
    const TestToken = createToken('test');
    useService(TestToken.optional);
    didRender = true;
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  const sim = getSimulator(app);
  await sim.render('/');
  t.ok(didRender, 'renders without error');
  t.end();
});

test('context#ServiceConsumer', async t => {
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
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});

test('context#withServices', async t => {
  const TestToken1 = createToken('test-1');
  const TestToken2 = createToken('test-2');
  const TestPlugin1 = createPlugin({provides: () => 1});
  const TestPlugin2 = createPlugin({provides: () => 2});
  let didRender = false;
  function TestComponent({mappedOne, mappedTwo, propValue}) {
    didRender = true;
    t.equal(mappedOne, 1, 'gets registered service');
    t.equal(mappedTwo, 2, 'gets registered service');
    t.equal(propValue, 3, 'passes props through');
    return React.createElement('div', null, 'hello');
  }
  const WrappedComponent = withServices(
    {
      test1: TestToken1,
      test2: TestToken2,
    },
    deps => ({mappedOne: deps.test1, mappedTwo: deps.test2})
  )(TestComponent);
  const element = React.createElement(WrappedComponent, {propValue: 3});
  const app = new App(element);
  app.register(TestToken1, TestPlugin1);
  app.register(TestToken2, TestPlugin2);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});
