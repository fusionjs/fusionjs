/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

import React from 'react';
import App, {createPlugin} from 'fusion-core';
import ReactApp from 'fusion-react';
import {getService, getSimulator} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {ReduxToken} from 'fusion-plugin-react-redux';
import {createMockEmitter} from './utils';

import Plugin, {
  mock,
  ResponseError,
  RPCToken,
  RPCHandlersToken,
  withRPCRedux,
  withRPCReactor,
} from '..';

test('plugin', () => {
  expect(typeof Plugin.provides).toBe('function');
  const handlers = {test() {}};
  // @ts-ignore
  const EventEmitter = createMockEmitter();

  const appCreator = () => {
    const app = new App('content', (el) => el);
    app.register(RPCHandlersToken, handlers);
    app.register(UniversalEventsToken, EventEmitter);
    return app;
  };

  const RPCRedux = getService(appCreator, Plugin);
  const mockCtx = {headers: {}, memoized: new Map()};
  // @ts-ignore
  expect(typeof RPCRedux.from(mockCtx).request).toBe('function');
});

test('mock plugin', () => {
  expect(typeof mock.provides).toBe('function');
  const handlers = {test() {}};

  const appCreator = () => {
    const app = new App('content', (el) => el);
    app.register(RPCHandlersToken, handlers);
    // @ts-ignore
    app.register(UniversalEventsToken, createMockEmitter());
    return app;
  };

  const RPCRedux = getService(appCreator, mock);
  const mockCtx = {headers: {}, memoized: new Map()};
  // @ts-ignore
  expect(typeof RPCRedux.from(mockCtx).request).toBe('function');
});

test('withRPCRedux hoc', async () => {
  let didRender = false;
  let handlerCalled = false;
  function Test(props) {
    didRender = true;
    expect(typeof props.test).toBe('function');
    if (!handlerCalled) {
      // function renders twice
      props.test('test-args');
      handlerCalled = true;
    }
    return 'hello';
  }
  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const expectedPayloads = ['test-args', 'test-resolve'];
  const store = {
    dispatch(action) {
      expect(action.type).toBe(expectedActions.shift());
      expect(action.payload).toBe(expectedPayloads.shift());
    },
    getState() {},
    subscribe() {},
  };
  expect(typeof withRPCRedux).toBe('function');
  // @ts-ignore
  const Connected = withRPCRedux('test')(Test);
  expect(Connected.displayName).toBe('WithRPCRedux(Test)');
  const app = new ReactApp(React.createElement(Connected));
  app.register(RPCToken, mock);
  app.register(
    RPCHandlersToken,
    createPlugin({
      provides() {
        return {
          test(args) {
            expect(args).toBe('test-args');
            return Promise.resolve('test-resolve');
          },
        };
      },
    })
  );
  app.register(
    ReduxToken,
    // @ts-ignore
    createPlugin({
      provides() {
        return {
          from: () => ({store}),
        };
      },
    })
  );
  // @ts-ignore
  app.register(UniversalEventsToken, createMockEmitter());
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(typeof ctx.body === 'string' && ctx.body.includes('hello')).toBe(true);
  expect(didRender).toBe(true);
});

test('withRPCReactor hoc', async () => {
  let didRender = false;
  let handlerCalled = false;
  function Test(props) {
    didRender = true;
    expect(typeof props.test).toBe('function');
    if (!handlerCalled) {
      // function renders twice
      props.test('test-args');
      handlerCalled = true;
    }
    return 'hello';
  }
  expect(typeof withRPCReactor).toBe('function');
  const Connected = withRPCReactor('test', {
    start() {},
    success() {},
    failure() {},
    // @ts-ignore
  })(Test);
  expect(Connected.displayName).toBe('WithRPCRedux(Test)');

  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const expectedPayloads = ['test-args', 'test-resolve'];
  const store = {
    dispatch(action) {
      expect(action.type).toBe(expectedActions.shift());
      expect(action.payload).toBe(expectedPayloads.shift());
    },
    getState() {},
  };
  const app = new ReactApp(React.createElement(Connected));
  app.register(RPCToken, mock);
  app.register(
    RPCHandlersToken,
    createPlugin({
      provides() {
        return {
          test(args) {
            expect(args).toBe('test-args');
            return Promise.resolve('test-resolve');
          },
        };
      },
    })
  );
  app.register(
    ReduxToken,
    createPlugin({
      provides() {
        return {
          from: () => ({store}),
        };
      },
    })
  );
  // @ts-ignore
  app.register(UniversalEventsToken, createMockEmitter());
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  expect(typeof ctx.body === 'string' && ctx.body.includes('hello')).toBe(true);
  expect(didRender).toBe(true);
});

test('ResponseError', () => {
  const e = new ResponseError('test');
  expect(e instanceof Error).toBe(true);
});
