import React from 'react';
import test from 'tape-cup';
import Plugin from '../../plugin';
import ShallowRenderer from 'react-test-renderer/shallow';
import {withRPCRedux, withRPCReactor} from '../../hoc';

test('plugin', t => {
  t.equals(typeof Plugin, 'function');
  const handlers = {test() {}};
  const EventEmitter = {
    of() {},
  };
  const RPCRedux = Plugin({handlers, EventEmitter});
  t.equal(typeof RPCRedux.of().test, 'function');
  t.end();
});

test('withRPCRedux hoc', t => {
  function Test() {}
  t.equals(typeof withRPCRedux, 'function');
  const Connected = withRPCRedux({
    rpcId: 'test',
    actions: {
      start() {},
      success() {},
      failure() {},
    },
    mapStateToParams: () => {},
    transformParams: () => {},
  })(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');
  const renderer = new ShallowRenderer();
  renderer.render(React.createElement(Connected), {
    rpc: {
      test() {},
    },
    store: {
      dispatch() {},
      getState() {},
    },
  });
  const rendered = renderer.getRenderOutput();
  t.equal(
    typeof rendered.props.test,
    'function',
    'passes the handler through to props'
  );
  t.end();
});

test('withRPCReactor hoc', t => {
  function Test() {}
  t.equals(typeof withRPCReactor, 'function');
  const Connected = withRPCReactor({
    rpcId: 'test',
    reactors: {
      start() {},
      success() {},
      failure() {},
    },
    mapStateToParams: () => {},
    transformParams: () => {},
  })(Test);
  t.equals(Connected.displayName, 'WithRPCRedux(Test)');
  const renderer = new ShallowRenderer();
  renderer.render(React.createElement(Connected), {
    rpc: {
      test() {},
    },
    store: {
      dispatch() {},
      getState() {},
    },
  });
  const rendered = renderer.getRenderOutput();
  t.equal(
    typeof rendered.props.test,
    'function',
    'passes the handler through to props'
  );
  t.end();
});
