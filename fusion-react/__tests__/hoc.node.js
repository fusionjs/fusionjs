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
import PropTypes from 'prop-types';
import App from '../src/index';
import hoc from '../src/hoc';
import plugin from '../src/plugin';
import compose from 'just-compose';

test('hoc#legacy', async () => {
  const withTest = hoc.create('test');
  const testProvides = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    expect(props.test).toStrictEqual(testProvides);
    expect(props.ctx).toBeFalsy();
    return React.createElement('div', null, 'hello');
  }
  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides})
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});

test('hoc#legacy with mapProvidesToProps', async () => {
  const withTest = hoc.create('test', provides => {
    return {mapped: provides};
  });

  const testProvides = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    expect(props.mapped).toStrictEqual(testProvides);
    return React.createElement('div', null, 'hello');
  }

  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides})
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});

test('hoc#legacy with custom provider', async () => {
  const withTest = hoc.create('test');

  const testProvides = {hello: 'world'};
  let didRender = false;
  let didUseCustomProvider = false;
  function TestComponent(props) {
    didRender = true;
    expect(props.test).toStrictEqual(testProvides);
    return React.createElement('div', null, 'hello');
  }
  class CustomProvider extends React.Component<*> {
    getChildContext() {
      return {test: this.props.provides};
    }
    render() {
      didUseCustomProvider = true;
      expect(this.props.ctx).toBeTruthy();
      return React.Children.only(this.props.children);
    }
  }
  CustomProvider.childContextTypes = {
    test: PropTypes.any.isRequired,
  };

  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides}),
    CustomProvider
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
  expect(didUseCustomProvider).toBeTruthy();
});

test('hoc', async () => {
  const TestToken1 = createToken('test-token-1');
  const TestToken2 = createToken('test-token-2');
  const TestToken3 = createToken('test-token-3');
  const withTest = compose(
    hoc.create('test1', undefined, TestToken1),
    hoc.create('test2', undefined, TestToken2),
    hoc.create('test3', provides => ({mapped: provides}), TestToken3)
  );
  const testProvides1 = {hello: 1};
  const testProvides2 = {hello: 2};
  const testProvides3 = {hello: 3};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    expect(props.test1).toStrictEqual(testProvides1);
    expect(props.test2).toStrictEqual(testProvides2);
    expect(props.mapped).toStrictEqual(testProvides3);
    expect(props.ctx).toBeFalsy();
    return React.createElement('div', null, 'hello');
  }
  const testPlugin1 = createPlugin({provides: () => testProvides1});
  const testPlugin2 = plugin.create(
    'test2',
    createPlugin({provides: () => testProvides2})
  );
  const testPlugin3 = createPlugin({provides: () => testProvides3});
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(TestToken1, testPlugin1);
  app.register(TestToken2, testPlugin2);
  app.register(TestToken3, testPlugin3);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(
    typeof ctx.body === 'string' && ctx.body.includes('hello')
  ).toBeTruthy();
  expect(didRender).toBeTruthy();
});
