/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import test from 'tape-cup';
import React from 'react';
import {prepared} from 'fusion-react-async';
import {compose, createStore} from 'redux';
import {Provider, connect} from 'react-redux';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import {reactorEnhancer} from 'redux-reactors';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import {mock as RPCPluginMock, RPCHandlersToken} from '../index';
import Plugin from '../plugin';
import {withRPCRedux, withRPCReactor} from '../hoc';

function setup() {
  const root = document.createElement('div');
  root.id = 'root';
  const span = document.createElement('span');
  span.textContent = 'hello world';
  root.appendChild(span);
  document.body.appendChild(root);
}
function teardown() {
  document.getElementById('root').remove();
}

test('browser plugin integration test withRPCRedux', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const fetch = (url, options) => {
    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(
      JSON.parse(options.body),
      {hello: 'world'},
      'sends correct body'
    );
    t.equal(options.method, 'POST', 'makes POST request');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: 'success',
          data: {
            a: 'b',
          },
        })
      )
    );
  };

  const expectedActions = [
    {type: '@@redux/INIT'},
    {type: 'TEST_START', payload: {hello: 'world'}},
    {type: 'TEST_SUCCESS', payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    t.deepLooseEqual(
      action,
      expectedActions.shift(),
      'dispatches expected action'
    );
    return action.payload;
  });

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
    prepared(
      props => (props.a ? Promise.resolve() : props.test({hello: 'world'}))
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(Plugin);
  app.register(RPCHandlersToken, {});
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');

  teardown();
  t.end();
});

test('browser plugin integration test withRPCRedux - failure', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const fetch = (url, options) => {
    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(
      JSON.parse(options.body),
      {hello: 'world'},
      'sends correct body'
    );
    t.equal(options.method, 'POST', 'makes POST request');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: 'failure',
          data: {
            message: 'message',
            code: 'code',
            meta: {hello: 'world'},
          },
        })
      )
    );
  };

  const expectedActions = [
    {type: '@@redux/INIT'},
    {type: 'TEST_START', payload: {hello: 'world'}},
    {
      type: 'TEST_FAILURE',
      payload: {message: 'message', code: 'code', meta: {hello: 'world'}},
    },
  ];
  const store = createStore((state, action) => {
    t.deepLooseEqual(
      action,
      expectedActions.shift(),
      'dispatches expected action'
    );
    return action.payload;
  });

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
    prepared(
      props =>
        props.message ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(Plugin);
  app.register(RPCHandlersToken, {});
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser mock integration test withRPCRedux', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const handlers = {
    test(args) {
      t.deepLooseEqual(
        args,
        {hello: 'world'},
        'passes correct args to handler'
      );
      return Promise.resolve({a: 'b'});
    },
  };
  const expectedActions = [
    {type: '@@redux/INIT'},
    {type: 'TEST_START', payload: {hello: 'world'}},
    {type: 'TEST_SUCCESS', payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    t.deepLooseEqual(
      action,
      expectedActions.shift(),
      'dispatches expected actions'
    );
    return action.payload;
  });

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
    prepared(
      props => (props.a ? Promise.resolve() : props.test({hello: 'world'}))
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser mock integration test withRPCRedux - failure', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const e = new Error('message');
  e.code = 'code';
  e.meta = {hello: 'world'};
  const handlers = {
    test(args) {
      t.deepLooseEqual(
        args,
        {hello: 'world'},
        'passes correct args to handler'
      );
      return Promise.reject(e);
    },
  };
  const expectedActions = [
    {type: '@@redux/INIT'},
    {type: 'TEST_START', payload: {hello: 'world'}},
    {
      type: 'TEST_FAILURE',
      payload: {message: 'message', code: 'code', meta: {hello: 'world'}},
    },
  ];
  const store = createStore((state, action) => {
    t.deepLooseEqual(
      action,
      expectedActions.shift(),
      'dispatches expected actions'
    );
    return action.payload;
  });

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
    prepared(
      props =>
        props.message ? Promise.resolve() : props.test({hello: 'world'})
    )
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest)
  );
  const app = new App(element);
  app.register(RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const fetch = (url, options) => {
    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(
      JSON.parse(options.body),
      {hello: 'world'},
      'sends correct body'
    );
    t.equal(options.method, 'POST', 'makes POST request');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: 'success',
          data: {
            a: 'b',
          },
        })
      )
    );
  };

  const expectedActions = [{type: '@@redux/INIT'}];
  const store = createStore(
    (state, action) => {
      t.deepLooseEqual(
        action,
        expectedActions.shift(),
        'dispatches expected action'
      );
      return action.payload;
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, success: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        t.equal(action.type, 'TEST_START', 'dispatches start action');
        t.deepLooseEqual(
          action.payload,
          {hello: 'world'},
          'dispatches start with correct payload'
        );
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: (state, action) => {
        flags.success = true;
        t.equal(action.type, 'TEST_SUCCESS', 'dispatches success action');
        t.deepLooseEqual(
          action.payload,
          {a: 'b'},
          'dispatches success with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
      failure: () => {
        t.fail('should not call failure');
        return {};
      },
    }),
    prepared(
      props => (props.a ? Promise.resolve() : props.test({hello: 'world'}))
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(Plugin);
  app.register(RPCHandlersToken, {});
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.success, true, 'dispatches success action');
  teardown();
  t.end();
});

test('browser mock plugin integration test withRPCReactor', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const handlers = {
    test(args) {
      t.deepLooseEqual(
        args,
        {hello: 'world'},
        'passes correct args to handler'
      );
      return Promise.resolve({a: 'b'});
    },
  };

  const expectedActions = [{type: '@@redux/INIT'}];
  const store = createStore(
    (state, action) => {
      t.deepLooseEqual(
        action,
        expectedActions.shift(),
        'dispatches expected action'
      );
      return {};
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, success: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        t.equal(action.type, 'TEST_START', 'dispatches start action');
        t.deepLooseEqual(
          action.payload,
          {hello: 'world'},
          'dispatches start with correct payload'
        );
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: (state, action) => {
        flags.success = true;
        t.equal(action.type, 'TEST_SUCCESS', 'dispatches success action');
        t.deepLooseEqual(
          action.payload,
          {a: 'b'},
          'dispatches success with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
      failure: () => {
        t.fail('should not call failure');
        return {};
      },
    }),
    prepared(
      props => (props.a ? Promise.resolve() : props.test({hello: 'world'}))
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.success, true, 'dispatches success action');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor - failure', async t => {
  setup();
  const EventEmitter = {
    from() {},
  };
  const e = new Error('Some failure');
  e.code = 'ERR_CODE';
  e.meta = {error: 'meta'};
  const handlers = {
    test(args) {
      t.deepLooseEqual(
        args,
        {hello: 'world'},
        'passes correct args to handler'
      );
      return Promise.reject(e);
    },
  };

  const expectedActions = [{type: '@@redux/INIT'}];
  const store = createStore(
    (state, action) => {
      t.deepLooseEqual(
        action,
        expectedActions.shift(),
        'dispatches expected action'
      );
      return {};
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, failure: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        t.equal(action.type, 'TEST_START', 'dispatches start action');
        t.deepLooseEqual(
          action.payload,
          {hello: 'world'},
          'dispatches start with correct payload'
        );
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: () => {
        t.fail('should not call success');
        return {};
      },
      failure: (state, action) => {
        flags.failure = true;
        t.equal(action.type, 'TEST_FAILURE', 'dispatches failure action');
        t.deepLooseEqual(
          action.payload,
          {
            message: e.message,
            code: e.code,
            meta: e.meta,
          },
          'dispatches failure with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(
      props =>
        props.message ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.failure, true, 'dispatches failure action');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor - failure', async t => {
  setup();
  const e = new Error('Some failure');
  e.code = 'ERR_CODE';
  e.meta = {error: 'meta'};
  const EventEmitter = {
    from() {},
  };
  const fetch = (url, options) => {
    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(
      JSON.parse(options.body),
      {hello: 'world'},
      'sends correct body'
    );
    t.equal(options.method, 'POST', 'makes POST request');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: 'failure',
          data: {
            message: e.message,
            code: e.code,
            meta: e.meta,
          },
        })
      )
    );
  };

  const expectedActions = [{type: '@@redux/INIT'}];
  const store = createStore(
    (state, action) => {
      t.deepLooseEqual(
        action,
        expectedActions.shift(),
        'dispatches expected action'
      );
      return action.payload;
    },
    {},
    reactorEnhancer
  );

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const flags = {start: false, failure: false};
  const hoc = compose(
    withRPCReactor('test', {
      start: (state, action) => {
        t.equal(action.type, 'TEST_START', 'dispatches start action');
        t.deepLooseEqual(
          action.payload,
          {hello: 'world'},
          'dispatches start with correct payload'
        );
        flags.start = true;
        return {
          loading: true,
        };
      },
      success: () => {
        t.fail('should not call success');
        return {};
      },
      failure: (state, action) => {
        flags.failure = true;
        t.equal(action.type, 'TEST_FAILURE', 'dispatches failure action');
        t.deepLooseEqual(
          action.payload,
          {
            message: e.message,
            code: e.code,
            meta: e.meta,
          },
          'dispatches failure with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(
      props =>
        props.message ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(Plugin);
  app.register(RPCHandlersToken, {});
  app.register(UniversalEventsToken, EventEmitter);
  app.register(FetchToken, fetch);
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.failure, true, 'dispatches failure action');
  teardown();
  t.end();
});
