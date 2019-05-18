/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import test from 'tape-cup';
import ShallowRenderer from 'react-test-renderer/shallow';

import App, {createPlugin} from 'fusion-core';
import ReactApp from 'fusion-react';
import type {Context} from 'fusion-core';
import {getService, getSimulator} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {ReduxToken} from 'fusion-plugin-react-redux';

import Plugin from '../plugin';
import {mock, ResponseError, RPCToken, RPCHandlersToken} from '../index';
import {withRPCRedux, withRPCReactor} from '../hoc';

/* Test helpers */
function createMockEmitter(props: mixed) {
  const emitter = {
    from: () => {
      return emitter;
    },
    emit: () => {},
    setFrequency: () => {},
    teardown: () => {},
    map: () => {},
    on: () => {},
    off: () => {},
    mapEvent: () => {},
    handleEvent: () => {},
    flush: () => {},
    ...props,
  };
  return emitter;
}

test('plugin', t => {
  t.equals(typeof Plugin.provides, 'function');
  const handlers = {test() {}};
  const EventEmitter = createMockEmitter();

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(RPCHandlersToken, handlers);
    app.register(UniversalEventsToken, EventEmitter);
    return app;
  };

  const RPCRedux = getService(appCreator, Plugin);
  const mockCtx: Context = ({headers: {}, memoized: new Map()}: any);
  t.equal(typeof RPCRedux.from(mockCtx).request, 'function');
  t.end();
});

test('mock plugin', t => {
  t.equals(typeof mock.provides, 'function');
  const handlers = {test() {}};

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(RPCHandlersToken, handlers);
    return app;
  };

  const RPCRedux = getService(appCreator, mock);
  const mockCtx: Context = ({headers: {}, memoized: new Map()}: any);
  t.equal(typeof RPCRedux.from(mockCtx).request, 'function');
  t.end();
});

test('withRPCRedux hoc', async t => {
  let didRender = false;
  let handlerCalled = false;
  function Test(props) {
    didRender = true;
    t.equal(
      typeof props.test,
      'function',
      'passes the handler through to props'
    );
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
      t.equal(action.type, expectedActions.shift());
      t.equal(action.payload, expectedPayloads.shift());
    },
    getState() {},
    subscribe() {},
  };
  t.equals(typeof withRPCRedux, 'function');
  const Connected = withRPCRedux('test')(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');
  const app = new ReactApp(React.createElement(Connected));
  app.register(RPCToken, mock);
  app.register(RPCHandlersToken, createPlugin({
    provides() {
      return {
        test(args) {
          t.equal(args, 'test-args');
          return Promise.resolve('test-resolve');
        },
      };
    }
  }));
  app.register(ReduxToken, createPlugin({
    provides() {
      return {
        from: () => ({store}),
      };
    },
  }));
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});

test('withRPCReactor hoc', async t => {
  let didRender = false;
  let handlerCalled = false;
  function Test(props) {
    didRender = true;
    t.equal(
      typeof props.test,
      'function',
      'passes the handler through to props'
    );
    if (!handlerCalled) {
      // function renders twice
      props.test('test-args');
      handlerCalled = true;
    }
    return 'hello';
  }
  t.equals(typeof withRPCReactor, 'function');
  const Connected = withRPCReactor('test', {
    start() {},
    success() {},
    failure() {},
  })(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');

  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const expectedPayloads = ['test-args', 'test-resolve'];
  const store = {
    dispatch(action) {
      t.equal(action.type, expectedActions.shift());
      t.equal(action.payload, expectedPayloads.shift());
    },
    getState() {},
  };
  const app = new ReactApp(React.createElement(Connected));
  app.register(RPCToken, mock);
  app.register(RPCHandlersToken, createPlugin({
    provides() {
      return {
        test(args) {
          t.equal(args, 'test-args');
          return Promise.resolve('test-resolve');
        },
      };
    }
  }));
  app.register(ReduxToken, createPlugin({
    provides() {
      return {
        from: () => ({store}),
      };
    },
  }));
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'), 'renders');
  t.ok(didRender);
  t.end();
});

test('ResponseError', t => {
  const e = new ResponseError('test');
  t.ok(e instanceof Error);
  t.end();
});
