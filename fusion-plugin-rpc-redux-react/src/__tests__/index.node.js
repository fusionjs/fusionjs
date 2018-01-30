/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import test from 'tape-cup';
import ShallowRenderer from 'react-test-renderer/shallow';
import Plugin from '../plugin';
import {mock} from '../index';
import {withRPCRedux, withRPCReactor} from '../hoc';

test('plugin', t => {
  t.equals(typeof Plugin.provides, 'function');
  const handlers = {test() {}};
  const EventEmitter = {
    from() {},
  };
  const RPCRedux = Plugin.provides({handlers, EventEmitter});
  const mockCtx = {headers: {}, memoized: new Map()};
  t.equal(typeof RPCRedux.from(mockCtx).request, 'function');
  t.end();
});

test('mock plugin', t => {
  t.equals(typeof mock.provides, 'function');
  const handlers = {test() {}};
  const EventEmitter = {
    from() {},
  };
  const RPCRedux = mock.provides({handlers, EventEmitter});
  const mockCtx = {headers: {}, memoized: new Map()};
  t.equal(typeof RPCRedux.from(mockCtx).request, 'function');
  t.end();
});

test('withRPCRedux hoc', t => {
  function Test() {}
  t.equals(typeof withRPCRedux, 'function');
  const Connected = withRPCRedux('test')(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');
  const renderer = new ShallowRenderer();
  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const expectedPayloads = ['test-args', 'test-resolve'];
  renderer.render(React.createElement(Connected), {
    rpc: {
      request(method, args) {
        t.equal(method, 'test');
        t.equal(args, 'test-args');
        return Promise.resolve('test-resolve');
      },
    },
    store: {
      dispatch(action) {
        t.equal(action.type, expectedActions.shift());
        t.equal(action.payload, expectedPayloads.shift());
      },
      getState() {},
    },
  });
  const rendered = renderer.getRenderOutput();
  t.equal(
    typeof rendered.props.test,
    'function',
    'passes the handler through to props'
  );
  rendered.props.test('test-args');
  t.end();
});

test('withRPCReactor hoc', t => {
  function Test() {}
  t.equals(typeof withRPCReactor, 'function');
  const Connected = withRPCReactor('test', {
    start() {},
    success() {},
    failure() {},
  })(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');
  const renderer = new ShallowRenderer();
  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const expectedPayloads = ['test-args', 'test-resolve'];
  renderer.render(React.createElement(Connected), {
    rpc: {
      request(method, args) {
        t.equal(method, 'test');
        t.equal(args, 'test-args');
        return Promise.resolve('test-resolve');
      },
    },
    store: {
      dispatch(action) {
        t.equal(action.type, expectedActions.shift());
        t.equal(action.payload, expectedPayloads.shift());
      },
      getState() {},
    },
  });
  const rendered = renderer.getRenderOutput();
  t.equal(
    typeof rendered.props.test,
    'function',
    'passes the handler through to props'
  );
  rendered.props.test('test-args');
  t.end();
});
