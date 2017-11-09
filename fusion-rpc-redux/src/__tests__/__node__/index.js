import test from 'tape-cup';
import {
  createRPCHandler,
  createRPCReactors,
  createRPCActions,
  createRPCReducer,
} from '../../index';

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
        t.equal(args, 'transformed-args');
        return 'start';
      },
      success: result => {
        t.equal(result, 'test-resolve');
        return 'success';
      },
      failure: () => {
        t.fail('should not call failure');
      },
    },
    store: {
      dispatch: action => {
        t.equal(action, expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
    },
    rpc: {
      request: rpcId => {
        t.equal(rpcId, 'test');
        return Promise.resolve('test-resolve');
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
  result.then(resolved => {
    t.equal(resolved, 'test-resolve');
    t.end();
  });
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
      },
      failure: e => {
        t.equal(error, e);
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
        t.equal(action.type, expectedActions.shift());
      },
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
      return 'test-start';
    },
    success: (state, action) => {
      t.equal(state, 'test-state');
      t.equal(action.type, 'GET_COUNT_SUCCESS');
      t.equal(action.payload, 'test-action');
      return 'test-success';
    },
    failure: (state, action) => {
      t.equal(state, 'test-state');
      t.equal(action.type, 'GET_COUNT_FAILURE');
      t.equal(action.payload, 'test-action');
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
  t.equal(reducer('abcd', {type: 'abcd'}), 'abcd');
  t.end();
});

test('createRPCReducer default reducers', t => {
  const reducer = createRPCReducer('getCount', {});
  const initialState = {a: 'b'};
  t.equal(reducer(initialState, {type: 'GET_COUNT_START'}), initialState);
  t.equal(reducer(initialState, {type: 'GET_COUNT_SUCCESS'}), initialState);
  t.equal(reducer(initialState, {type: 'GET_COUNT_FAILURE'}), initialState);
  t.end();
});
