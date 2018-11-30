/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import execa from 'execa';
import {
  createRPCHandler,
  createRPCReactors,
  createRPCActions,
  createRPCReducer,
} from '../index';

test('Flow tests', async t => {
  const failurePath = 'src/fixtures/failure';
  const successPath = 'src/fixtures/success';
  try {
    await execa.shell(`flow check ${failurePath}`);
    t.fail('Should fail flow check');
  } catch (e) {
    const {stdout} = e;
    t.ok(stdout.includes('Found 5 errors'));
  }
  await execa.shell(`flow check ${successPath}`);
  t.end();
});

test('api', t => {
  t.equal(typeof createRPCHandler, 'function', 'exposes a getHandler function');
  t.equal(
    typeof createRPCReactors,
    'function',
    'exposes a createRPCReactors function'
  );
  t.equal(
    typeof createRPCActions,
    'function',
    'exposes a createRPCActions function'
  );
  t.equal(
    typeof createRPCReducer,
    'function',
    'exposes a createRPCReducer function'
  );
  t.end();
});

test('createRPCHandler success', t => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        t.equal(args.transformed, 'transformed-args');
        t.equal(args.mapped, 'mapped-params');
        return 'start';
      },
      success: result => {
        t.equal(result, 'test-resolve');
        return 'success';
      },
      failure: () => {
        t.fail('should not call failure');
        return 'failure';
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        t.equal(rpcId, 'test');
        return Promise.resolve('test-resolve');
      },
    },
    rpcId: 'test',
    mapStateToParams: (state, args) => {
      t.equal(args, 'args');
      t.equal(state, 'test-state');
      return {
        args: args,
        mapped: 'mapped-params',
      };
    },
    transformParams: params => {
      t.equal(params.mapped, 'mapped-params');
      return {
        mapped: params.mapped,
        transformed: 'transformed-args',
      };
    },
  });
  const result = handler('args');
  t.ok(result instanceof Promise);
  result.then(resolved => {
    t.equal(resolved, 'test-resolve');
    t.end();
  });
});

test('createRPCHandler error in success reducer', t => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        return 'start';
      },
      success: result => {
        throw new Error('Fail');
      },
      failure: () => {
        t.fail('should not call failure');
        return 'failure';
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        return Promise.resolve('test-resolve');
      },
    },
    rpcId: 'test',
  });
  handler('args').catch(e => {
    t.equal(e.message, 'Fail', 'bubbles error with message');
    t.ok(e.stack, 'bubbles error with stack');
    t.end();
  });
});

test('createRPCHandler error in start reducer', async t => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        throw new Error('Fail');
      },
      success: () => {
        t.fail('should not call success');
        return 'success';
      },
      failure: () => {
        t.fail('should not call failure');
        return 'failure';
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        return Promise.resolve('test-resolve');
      },
    },
    rpcId: 'test',
  });
  try {
    await handler('args');
  } catch (e) {
    t.equal(e.message, 'Fail', 'bubbles error with message');
    t.ok(e.stack, 'bubbles error with stack');
    t.end();
  }
});

test('createRPCHandler error in failure reducer', async t => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        return 'start';
      },
      success: () => {
        t.fail('should not call success');
        return 'success';
      },
      failure: () => {
        throw new Error('Fail');
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        return Promise.reject('test-reject');
      },
    },
    rpcId: 'test',
  });
  try {
    await handler('args');
  } catch (e) {
    t.equal(e.message, 'Fail', 'bubbles error with message');
    t.ok(e.stack, 'bubbles error with stack');
    t.end();
  }
});

test('createRPCHandler failure', t => {
  const expectedActions = ['start', 'failure'];
  const error = new Error('fail');
  const handler = createRPCHandler({
    actions: {
      start: args => {
        t.equal(args, 'transformed-args');
        return 'start';
      },
      success: () => {
        t.fail('should not call success');
        return 'success';
      },
      failure: e => {
        t.equals(e.message, error.message);
        t.deepEqual(e.initialArgs, 'transformed-args');
        return 'failure';
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        t.equal(rpcId, 'test');
        return Promise.reject(error);
      },
    },
    rpcId: 'test',
    mapStateToParams: state => {
      t.equal(state, 'test-state');
      return 'mapped-params';
    },
    transformParams: params => {
      t.equal(params, 'mapped-params');
      return 'transformed-args';
    },
  });
  const result = handler('args');
  t.ok(result instanceof Promise);
  result.then(reject => {
    t.equal(reject, error);
    t.end();
  });
});

test('createRPCHandler optional parameters', t => {
  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const handler = createRPCHandler({
    store: {
      dispatch: action => {
        t.equal(
          typeof action === 'object' && action.type,
          expectedActions.shift()
        );
      },
      getState: () => {},
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        t.equal(rpcId, 'test');
        return Promise.resolve('response');
      },
    },
    rpcId: 'test',
  });
  const result = handler('args');
  t.ok(result instanceof Promise);
  result.then(response => {
    t.equal(response, 'response');
    t.end();
  });
});

test('createRPCReactors', t => {
  const reactors = createRPCReactors('getCount', {
    start() {},
    success() {},
    failure() {},
  });
  t.equal(typeof reactors.start, 'function', 'exposes a start function');
  t.equal(typeof reactors.success, 'function', 'exposes a success function');
  t.equal(typeof reactors.failure, 'function', 'exposes a failure function');
  if (!reactors.start) {
    t.fail();
    t.end();
    return;
  }
  const {type, payload} = reactors.start('test-payload');
  t.equal(type, 'GET_COUNT_START');
  t.equal(payload, 'test-payload');
  t.end();
});

test('createRPCReactors optional reducers', t => {
  const reactors = createRPCReactors('getCount', {});
  t.equal(typeof reactors.start, 'function', 'exposes a start function');
  t.equal(typeof reactors.success, 'function', 'exposes a success function');
  t.equal(typeof reactors.failure, 'function', 'exposes a failure function');
  if (!reactors.start) {
    t.fail();
    t.end();
    return;
  }
  const {type, payload} = reactors.start('test-payload');
  t.equal(type, 'GET_COUNT_START');
  t.equal(payload, 'test-payload');
  t.end();
});

test('createRPCActions', t => {
  const {start, success, failure} = createRPCActions('getCount');
  t.deepLooseEqual(start(5), {type: 'GET_COUNT_START', payload: 5});
  t.deepLooseEqual(success(5), {type: 'GET_COUNT_SUCCESS', payload: 5});
  t.deepLooseEqual(failure(5), {type: 'GET_COUNT_FAILURE', payload: 5});
  t.end();
});

test('createRPCReducer', t => {
  const reducer = createRPCReducer('getCount', {
    start: (state, action) => {
      t.equal(state, 'test-state');
      t.equal(action.type, 'GET_COUNT_START');
      t.equal(action.payload, 'test-action');
      // $FlowFixMe
      return 'test-start';
    },
    success: (state, action) => {
      t.equal(state, 'test-state');
      t.equal(action.type, 'GET_COUNT_SUCCESS');
      t.equal(action.payload, 'test-action');
      // $FlowFixMe
      return 'test-success';
    },
    failure: (state, action) => {
      t.equal(state, 'test-state');
      t.equal(action.type, 'GET_COUNT_FAILURE');
      t.equal(action.payload, 'test-action');
      // $FlowFixMe
      return 'test-failure';
    },
  });

  t.equal(
    reducer('test-state', {
      type: 'GET_COUNT_START',
      payload: 'test-action',
    }),
    'test-start'
  );
  t.equal(
    reducer('test-state', {
      type: 'GET_COUNT_SUCCESS',
      payload: 'test-action',
    }),
    'test-success'
  );
  t.equal(
    reducer('test-state', {
      type: 'GET_COUNT_FAILURE',
      payload: 'test-action',
    }),
    'test-failure'
  );
  t.equal(reducer('abcd', {type: 'abcd', payload: {}}), 'abcd');
  t.end();
});

test('createRPCReducer default reducers', t => {
  const reducer = createRPCReducer('getCount', {});
  const initialState = {a: 'b'};
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_START', payload: {}}),
    initialState
  );
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_SUCCESS', payload: {}}),
    initialState
  );
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_FAILURE', payload: {}}),
    initialState
  );
  t.end();
});

test('createRPCReducer custom default state', t => {
  const initialState = 123;
  const reducer = createRPCReducer('getCount', {}, initialState);
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_START', payload: {}}),
    initialState
  );
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_SUCCESS', payload: {}}),
    initialState
  );
  t.equal(
    reducer(initialState, {type: 'GET_COUNT_FAILURE', payload: {}}),
    initialState
  );
  t.end();
});
