/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {createToken, createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import App from '../src/index';
import {
  FusionContext,
  ServiceConsumer,
  useService,
  withServices,
} from '../src/context.js';

test('context#useService', async () => {
  const TestToken = createToken('test');
  const TestPlugin = createPlugin({provides: () => 3});
  let didRender = false;
  function TestComponent() {
    const provides = useService(TestToken);
    const ctx = React.useContext(FusionContext);
    didRender = true;
    expect(provides).toBe(3);
    expect(ctx.request.url).toBe('/');
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  app.register(TestToken, TestPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});

test('context#useService - unregistered token', async () => {
  let didRender = false;
  function TestComponent() {
    const TestToken = createToken('test');
    useService(TestToken);
    didRender = true;
    return React.createElement('div', null, 'successful render');
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(ctx.rendered).not.toContain('successful render'); // falls back to client render
  expect(didRender).toBeFalsy(); // error thrown within component is caught and logged
});

test('context#useService - optional token', async () => {
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
  expect(didRender).toBeTruthy();
});

test('context#ServiceConsumer', async () => {
  const TestToken = createToken('test');
  const TestPlugin = createPlugin({provides: () => 3});
  let didRender = false;
  function TestComponent() {
    return React.createElement(
      ServiceConsumer,
      {token: TestToken},
      provides => {
        didRender = true;
        expect(provides).toBe(3);
        return React.createElement('div', null, 'hello');
      }
    );
  }
  const element = React.createElement(TestComponent);
  const app = new App(element);
  app.register(TestToken, TestPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});

test('context#withServices', async () => {
  const TestToken1 = createToken('test-1');
  const TestToken2 = createToken('test-2');
  const TestPlugin1 = createPlugin({provides: () => 1});
  const TestPlugin2 = createPlugin({provides: () => 2});
  let didRender = false;
  function TestComponent({mappedOne, mappedTwo, propValue}) {
    didRender = true;
    expect(mappedOne).toBe(1);
    expect(mappedTwo).toBe(2);
    expect(propValue).toBe(3);
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
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});
