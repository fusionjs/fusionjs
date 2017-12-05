import React from 'react';
import test from 'tape-cup';
import Plugin from '../../plugin';
import {mock} from '../../index';
import ShallowRenderer from 'react-test-renderer/shallow';
import {withRPCRedux, withRPCReactor} from '../../hoc';

test('plugin', t => {
  t.equals(typeof Plugin, 'function');
  const handlers = {test() {}};
  const EventEmitter = {
    of() {},
  };
  const RPCRedux = Plugin({handlers, EventEmitter});
  const mockCtx = {headers: {}};
  t.equal(typeof RPCRedux.of(mockCtx).request, 'function');
  t.end();
});

test('mock plugin', t => {
  t.equals(typeof mock, 'function');
  const handlers = {test() {}};
  const EventEmitter = {
    of() {},
  };
  const RPCRedux = mock({handlers, EventEmitter});
  const mockCtx = {headers: {}};
  t.equal(typeof RPCRedux.of(mockCtx).request, 'function');
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
