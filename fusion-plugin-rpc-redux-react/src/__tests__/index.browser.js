/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';
import React from 'react';
import App, {prepared, serviceContextPlugin} from 'fusion-react';
import {compose, createStore} from 'redux';
import {Provider, connect} from 'react-redux';
import {getSimulator} from 'fusion-test-utils';
import {reactorEnhancer} from 'redux-reactors';
import {FetchToken} from 'fusion-tokens';
import {mock as RPCPluginMock, RPCToken, RPCHandlersToken} from '../index';
import Plugin from '../plugin';
import {withRPCRedux, withRPCReactor} from '../hoc';

console.log({serviceContextPlugin});

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

test('browser plugin integration test withRPCRedux', async t => {
  setup();
  const fetch = (url, options) => {
    if (!options || !options.body || typeof options.body !== 'string') {
      throw new Error(`Expected a string from options.body`);
    }
    const body: string = options.body;

    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(JSON.parse(body), {hello: 'world'}, 'sends correct body');
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
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    t.ok(fixture.type.test(action.type), 'dispatches expected action type');
    t.deepLooseEqual(
      action.payload,
      // $FlowFixMe
      fixture.payload,
      'dispatches expected action payload'
    );
    return action.payload;
  }, null);

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
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
  app.register(FetchToken, fetch);
  app.register(serviceContextPlugin(app));
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');

  teardown();
  t.end();
});

test('browser plugin integration test withRPCRedux and options', async t => {
  setup();
  const fetch = (url, options) => {
    if (!options || !options.body || typeof options.body !== 'string') {
      throw new Error(`Expected a string from options.body`);
    }
    const body: string = options.body;

    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(
      JSON.parse(body),
      {arg: 1, state: 2, prop: 3},
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
    {type: initActionPattern},
    {type: /TEST_START/, payload: {arg: 1, state: 2, prop: 3}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore(
    (state, action) => {
      const fixture = expectedActions.shift();
      t.ok(fixture.type.test(action.type), 'dispatches expected action type');
      t.deepLooseEqual(
        action.payload,
        // $FlowFixMe
        fixture.payload,
        'dispatches expected action payload'
      );
      return {...state, ...action.payload};
    },
    {state: 2}
  );

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const mapStateToParams = (state, args, props) => {
    return {...state, ...args, ...props};
  };

  const withTest = compose(
    withRPCRedux('test', {mapStateToParams}),
    connect(s => s),
    prepared(props => (props.a ? Promise.resolve() : props.test({arg: 1})))
  )(Component);

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(withTest, {prop: 3})
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(FetchToken, fetch);
  app.register(serviceContextPlugin(app));
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');

  teardown();
  t.end();
});

test('browser plugin integration test withRPCRedux - failure', async t => {
  setup();
  const fetch = (url, options) => {
    if (!options || !options.body || typeof options.body !== 'string') {
      throw new Error(`Expected a string from options.body`);
    }
    const body: string = options.body;

    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(JSON.parse(body), {hello: 'world'}, 'sends correct body');
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
    t.ok(fixture.type.test(action.type), 'dispatches expected action type');
    t.deepLooseEqual(
      action.payload,
      // $FlowFixMe
      fixture.payload,
      'dispatches expected action payload'
    );
    return action.payload;
  }, null);

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
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
  app.register(FetchToken, fetch);
  app.register(serviceContextPlugin(app));
  await getSimulator(app)
    .render('/')
    .catch(e => t.equal(e.message, 'message'));
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser mock integration test withRPCRedux', async t => {
  setup();
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
    {type: initActionPattern},
    {type: /TEST_START/, payload: {hello: 'world'}},
    {type: /TEST_SUCCESS/, payload: {a: 'b'}},
  ];
  const store = createStore((state, action) => {
    const fixture = expectedActions.shift();
    t.ok(fixture.type.test(action.type), 'dispatches expected action type');
    t.deepLooseEqual(
      action.payload,
      // $FlowFixMe
      fixture.payload,
      'dispatches expected action payload'
    );
    return action.payload;
  }, null);

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
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
  app.register(RPCHandlersToken, handlers);
  app.register(serviceContextPlugin(app));
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser mock integration test withRPCRedux - failure', async t => {
  setup();
  const e = new Error('message');
  // $FlowFixMe
  e.code = 'code';
  // $FlowFixMe
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
    t.ok(fixture.type.test(action.type), 'dispatches expected action type');
    t.deepLooseEqual(
      action.payload,
      // $FlowFixMe
      fixture.payload,
      'dispatches expected action payload'
    );
    return action.payload;
  }, null);

  const Component = props => {
    t.equal(typeof props.test, 'function', 'passes correct prop to component');
    return React.createElement('span', null, 'hello world');
  };

  const withTest = compose(
    withRPCRedux('test'),
    connect(s => s),
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
  app.register(RPCHandlersToken, handlers);
  app.register(serviceContextPlugin(app));
  await getSimulator(app)
    .render('/')
    .catch(e => t.equal(e.message, 'message'));
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor', async t => {
  setup();
  const fetch = (url, options) => {
    if (!options || !options.body || typeof options.body !== 'string') {
      throw new Error(`Expected a string from options.body`);
    }
    const body: string = options.body;

    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(JSON.parse(body), {hello: 'world'}, 'sends correct body');
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

  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      t.ok(
        expectedActions.shift().type.test(action.type),
        'dispatches expected action type'
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
      start: (state, action): any => {
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
      failure: (): any => {
        t.fail('should not call failure');
        return {};
      },
    }),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, Plugin);
  app.register(FetchToken, fetch);
  app.register(serviceContextPlugin(app));
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.success, true, 'dispatches success action');
  teardown();
  t.end();
});

test('browser mock plugin integration test withRPCReactor', async t => {
  setup();
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

  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      t.ok(
        expectedActions.shift().type.test(action.type),
        'dispatches expected action type'
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
      start: (state, action): any => {
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
      failure: (): any => {
        t.fail('should not call failure');
        return {};
      },
    }),
    prepared(props =>
      props.a ? Promise.resolve() : props.test({hello: 'world'})
    ),
    connect(s => s)
  );

  const element = React.createElement(
    Provider,
    {store},
    React.createElement(hoc(Component))
  );
  const app = new App(element);
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(serviceContextPlugin(app));
  await getSimulator(app).render('/');
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.success, true, 'dispatches success action');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor - failure', async t => {
  setup();
  const e = new Error('Some failure');
  // $FlowFixMe
  e.code = 'ERR_CODE';
  // $FlowFixMe
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

  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      t.ok(
        expectedActions.shift().type.test(action.type),
        'dispatches expected action type'
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
      start: (state, action): any => {
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
      success: (): any => {
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
            // $FlowFixMe
            code: e.code,
            // $FlowFixMe
            meta: e.meta,
            initialArgs: {hello: 'world'},
          },
          'dispatches failure with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(props =>
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
  app.register(RPCToken, RPCPluginMock);
  app.register(RPCHandlersToken, handlers);
  app.register(serviceContextPlugin(app));
  await getSimulator(app)
    .render('/')
    .catch(e => t.equal(e.message, 'Some failure'));
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.failure, true, 'dispatches failure action');
  teardown();
  t.end();
});

test('browser plugin integration test withRPCReactor - failure 2', async t => {
  setup();
  const e = new Error('Some failure');
  // $FlowFixMe
  e.code = 'ERR_CODE';
  // $FlowFixMe
  e.meta = {error: 'meta'};
  const fetch = (url, options) => {
    if (!options || !options.body || typeof options.body !== 'string') {
      throw new Error(`Expected a string from options.body`);
    }
    const body: string = options.body;

    t.equal(url, '/api/test', 'fetches to expected url');
    t.deepLooseEqual(JSON.parse(body), {hello: 'world'}, 'sends correct body');
    t.equal(options.method, 'POST', 'makes POST request');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: 'failure',
          data: {
            message: e.message,
            // $FlowFixMe
            code: e.code,
            // $FlowFixMe
            meta: e.meta,
            initialArgs: {hello: 'world'},
          },
        })
      )
    );
  };

  const expectedActions = [{type: initActionPattern}];
  const store = createStore(
    (state, action) => {
      t.ok(
        expectedActions.shift().type.test(action.type),
        'dispatches expected action type'
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
      start: (state, action): any => {
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
      success: (): any => {
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
            // $FlowFixMe
            code: e.code,
            // $FlowFixMe
            meta: e.meta,
            initialArgs: {hello: 'world'},
          },
          'dispatches failure with correct payload'
        );
        return {
          ...action.payload,
          loading: false,
        };
      },
    }),
    prepared(props =>
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
  app.register(RPCToken, Plugin);
  app.register(FetchToken, fetch);
  app.register(serviceContextPlugin(app));
  await getSimulator(app)
    .render('/')
    .catch(e => t.equal(e.message, 'Some failure'));
  t.equal(expectedActions.length, 0, 'dispatches all actions');
  t.equal(flags.start, true, 'dispatches start action');
  t.equal(flags.failure, true, 'dispatches failure action');
  teardown();
  t.end();
});
