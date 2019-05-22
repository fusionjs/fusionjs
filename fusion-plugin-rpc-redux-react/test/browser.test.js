/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

/* eslint-env node, browser */
const React = require('react');
const {default: App, prepared} = require('fusion-react');
const {createPlugin} = require('fusion-core');
const {compose, createStore} = require('redux');
const {Provider, connect} = require('react-redux');
const {getSimulator} = require('fusion-test-utils');
const {reactorEnhancer} = require('redux-reactors');
const {ReduxToken} = require('fusion-plugin-react-redux');
const {createMockEmitter} = require('./utils.js');
const {UniversalEventsToken} = require('fusion-plugin-universal-events');
const {
  default: Plugin,
  withRPCRedux,
  withRPCReactor,
  mock: RPCPluginMock,
  RPCToken,
  RPCHandlersToken,
} = require('..');

const initActionPattern = /^@@redux\/INIT.*/;

/* Test helpers */
function setup() {
  const root = document.createElement('div');
  root.id = 'root';
  const span = document.createElement('span');
  span.textContent = 'hello world';
  root.appendChild(span);
  document.body && document.body.appendChild(root);
}

function teardown() {
  const root = document.getElementById('root');
  if (root) {
    root.remove();
  }
}

test('browser plugin integration test withRPCRedux', async done => {
  setup();
  const expectedActions = [
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    expect(fixture.type.test(action.type)).toBe(true);
    // $FlowFixMe
    expect(action.payload).toEqual(fixture.payload);
    return action.payload;
  }, null);

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => ({s})),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    async test() {
      return {a: 'b'};
    },
  });
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
  await getSimulator(app).render('/');
  expect(expectedActions.length).toBe(0);

  teardown();
  done();
});

test('browser plugin integration test withRPCRedux and options', async done => {
  setup();
  const expectedActions = [
    {type: initActionPattern},
    {type: /TEST_START/, payload: {arg: 1, state: 2, prop: 3}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore(
    (state, action) => {
      const fixture = expectedActions.shift();
      expect(fixture.type.test(action.type)).toBe(true);
      // $FlowFixMe
      expect(action.payload).toEqual(fixture.payload);
      return {...state, ...action.payload};
    },
    {state: 2}
  );

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const mapStateToParams = (state, args, props) => {
    return {...state, ...args, ...props};
  };

  const withTest = compose(
    withRPCRedux('test', {mapStateToParams}),
    connect(s => ({s})),
    prepared(props => (props.a ? Promise.resolve() : props.test({arg: 1})))
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest, {prop: 3})
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    async test(args) {
      expect(args).toEqual({arg: 1, state: 2, prop: 3});
      return {a: 'b'};
    },
  });
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
  await getSimulator(app).render('/');
  expect(expectedActions.length).toBe(0);

  teardown();
  done();
});

test('browser plugin integration test withRPCRedux - failure', async done => {
  setup();
  const expectedActions = [
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {
      type: /TEST_FAILURE/,
      payload: {
        message: 'message',
        code: 'code',
        meta: {hello: 'world'},
        initialArgs: {
          hello: 'world',
        },
      },
    },
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    expect(fixture.type.test(action.type)).toBe(true);
    // $FlowFixMe
    expect(action.payload).toEqual(fixture.payload);
    return action.payload;
  }, null);

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => ({s})),
    prepared(props =>
      props.message ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    async test(args, ctx) {
      expect(args).toEqual({hello: 'world'});
      throw {
        message: 'message',
        code: 'code',
        meta: {hello: 'world'},
        initialArgs: args,
      };
    },
  });
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
  await getSimulator(app)
    .render('/')
    .catch(e => expect(e.message).toBe('message'));
  expect(expectedActions.length).toBe(0);
  teardown();
  done();
});

test('browser mock integration test withRPCRedux', async done => {
  setup();
  const expectedActions = [
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    expect(fixture.type.test(action.type)).toBe(true);
    // $FlowFixMe
    expect(action.payload).toEqual(fixture.payload);
    return action.payload;
  }, null);

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => ({s})),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, {
    test(args) {
      expect(args).toEqual({hello: 'world'});
      return Promise.resolve({a: 'b'});
    },
  });
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
  await getSimulator(app).render('/');
  expect(expectedActions.length).toBe(0);
  teardown();
  done();
});

test('browser mock integration test withRPCRedux - failure', async done => {
  setup();
  const expectedActions = [
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {
      type: /TEST_FAILURE/,
      payload: {
        message: 'message',
        code: 'code',
        meta: {hello: 'world'},
        initialArgs: {hello: 'world'},
      },
    },
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    expect(fixture.type.test(action.type)).toBe(true);
    // $FlowFixMe
    expect(action.payload).toEqual(fixture.payload);
    return action.payload;
  }, null);

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => ({s})),
    prepared(props =>
      props.message ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, {
    test(args) {
      expect(args).toEqual({hello: 'world'});
      throw {
        message: 'message',
        code: 'code',
        meta: {hello: 'world'},
        initialArgs: args,
      };
    },
  });
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
  await getSimulator(app)
    .render('/')
    .catch(e => expect(e.message).toBe('message'));
  expect(expectedActions.length).toBe(0);
  teardown();
  done();
});

test('browser plugin integration test withRPCReactor', async done => {
  setup();
  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      expect(expectedActions.shift().type.test(action.type)).toBe(true);
      return action.payload;
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, success: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        expect(action.type).toBe('TEST_START');
        expect(action.payload).toEqual({hello: 'world'});
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: (state, action) => {
        flags.success = true;
        expect(action.type).toBe('TEST_SUCCESS');
        expect(action.payload).toEqual({a: 'b'});
        return {
          ...action.payload,
          loading: false,
        };
      },
      failure: () => {
        throw new AssertionError('should not call failure'); // eslint-disable-line
      },
    }),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => ({s}))
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    async test(args, ctx) {
      expect(args).toEqual({hello: 'world'});
      return {a: 'b'};
    },
  });
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
  await getSimulator(app).render('/');
  expect(expectedActions.length).toBe(0);
  expect(flags.start).toBe(true);
  expect(flags.success).toBe(true);
  teardown();
  done();
});

test('browser mock plugin integration test withRPCReactor', async done => {
  setup();
  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      expect(expectedActions.shift().type.test(action.type)).toBe(true);
      return {};
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, success: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        expect(action.type).toBe('TEST_START');
        expect(action.payload).toEqual({hello: 'world'});
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: (state, action) => {
        flags.success = true;
        expect(action.type).toBe('TEST_SUCCESS');
        expect(action.payload).toEqual({a: 'b'});
        return {
          ...action.payload,
          loading: false,
        };
      },
      failure: () => {
        throw new AssertionError('should not call failure'); // eslint-disable-line
      },
    }),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => ({s}))
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, {
    test(args) {
      expect(args).toEqual({hello: 'world'});
      return Promise.resolve({a: 'b'});
    },
  });
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
  await getSimulator(app).render('/');
  expect(expectedActions.length).toBe(0);
  expect(flags.start).toBe(true);
  expect(flags.success).toBe(true);
  teardown();
  done();
});

test('browser plugin integration test withRPCReactor - failure', async done => {
  setup();
  const err = {
    message: 'Some failure',
    code: 'ERR_CODE',
    meta: {error: 'meta'},
  };
  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      expect(expectedActions.shift().type.test(action.type)).toBe(true);
      return {};
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };
  const flags = {start: false, failure: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        expect(action.type).toBe('TEST_START');
        expect(action.payload).toEqual({hello: 'world'});
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: () => {
        throw new AssertionError('should not call success'); // eslint-disable-line
      },
      failure: (state, action) => {
        flags.failure = true;
        expect(action.type).toBe('TEST_FAILURE');
        expect(action.payload).toEqual({
          ...err,
          initialArgs: {hello: 'world'},
        });
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(props =>
      props.message ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => ({s}))
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, {
    test(args) {
      expect(args).toEqual({hello: 'world'});
      throw {
        ...err,
        initialArgs: args,
      };
    },
  });
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
  await getSimulator(app)
    .render('/')
    .catch(e => expect(e.message).toBe('Some failure'));
  expect(expectedActions.length).toBe(0);
  expect(flags.start).toBe(true);
  expect(flags.failure).toBe(true);
  teardown();
  done();
});

test('browser plugin integration test withRPCReactor - failure 2', async done => {
  setup();
  const err = {
    message: 'Some failure',
    code: 'ERR_CODE',
    meta: {error: 'meta'},
  };
  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      expect(expectedActions.shift().type.test(action.type)).toBe(true);
      return action.payload;
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    expect(typeof props.test).toBe('function');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, failure: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        expect(action.type).toBe('TEST_START');
        expect(action.payload).toEqual({hello: 'world'});
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: () => {
        throw new AssertionError('should not call success'); // eslint-disable-line
      },
      failure: (state, action) => {
        flags.failure = true;
        expect(action.type).toBe('TEST_FAILURE');
        expect(action.payload).toEqual({
          ...err,
          initialArgs: {hello: 'world'},
        });
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(props =>
      props.message ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => ({s}))
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    test(args) {
      expect(args).toEqual({hello: 'world'});
      throw {
        ...err,
        initialArgs: args,
      };
    },
  });
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
  await getSimulator(app)
    .render('/')
    .catch(e => expect(e.message).toBe('Some failure'));
  expect(expectedActions.length).toBe(0);
  expect(flags.start).toBe(true);
  expect(flags.failure).toBe(true);
  teardown();
  done();
});
