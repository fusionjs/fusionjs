/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import execa from 'execa';
import {
  createRPCHandler,
  createRPCReactors,
  createRPCActions,
  createRPCReducer,
} from '../src/index';

// With monolothic Flow job, need to refactor error tests. Probably using
// --max-warnings=0 and erroring on unused supressions.
// test('Flow tests', async done => {
//   const failurePath = 'src/fixtures/failure';
//   const successPath = 'src/fixtures/success';
//   await expect(execa.shell(`flow check ${failurePath}`)).rejects.toThrow(
//     'Found 5 errors'
//   );
//   await execa.shell(`flow check ${successPath}`);
//   done();
// });

test('api', () => {
  expect(typeof createRPCHandler).toBe('function');
  expect(typeof createRPCReactors).toBe('function');
  expect(typeof createRPCActions).toBe('function');
  expect(typeof createRPCReducer).toBe('function');
});

test('createRPCHandler success', done => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        expect(args.transformed).toBe('transformed-args');
        expect(args.mapped).toBe('mapped-params');
        return {type: 'start', payload: args};
      },
      success: result => {
        expect(result).toBe('test-resolve');
        return {type: 'success', payload: result};
      },
      failure: e => {
        // $FlowFixMe
        done.fail('should not call failure');
        return {type: 'failure', payload: e};
      },
    },
    store: {
      dispatch: action => {
        expect(action.type).toBe(expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        expect(rpcId).toBe('test');
        return Promise.resolve('test-resolve');
      },
    },
    rpcId: 'test',
    mapStateToParams: (state, args) => {
      expect(args).toBe('args');
      expect(state).toBe('test-state');
      return {
        args: args,
        mapped: 'mapped-params',
      };
    },
    transformParams: params => {
      expect(params.mapped).toBe('mapped-params');
      return {
        mapped: params.mapped,
        transformed: 'transformed-args',
      };
    },
  });
  const result = handler('args');
  expect(result instanceof Promise).toBeTruthy();
  result.then(resolved => {
    expect(resolved).toBe('test-resolve');
    done();
  });
});

test('createRPCHandler error in success reducer', done => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        return {type: 'start', payload: args};
      },
      success: result => {
        throw new Error('Fail');
      },
      failure: e => {
        // $FlowFixMe
        done.fail('should not call failure');
        return {type: 'failure', payload: e};
      },
    },
    store: {
      dispatch: action => {
        expect(action.type).toBe(expectedActions.shift());
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
    expect(e.message).toBe('Fail');
    expect(e.stack).toBeTruthy();
    done();
  });
});

test('createRPCHandler error in start reducer', async done => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        throw new Error('Fail');
      },
      success: result => {
        // $FlowFixMe
        done.fail('should not call success');
        return {type: 'success', payload: result};
      },
      failure: e => {
        // $FlowFixMe
        done.fail('should not call failure');
        return {type: 'failure', payload: e};
      },
    },
    store: {
      dispatch: action => {
        expect(action.type).toBe(expectedActions.shift());
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
  // Will throw before promise is returned
  expect(() => handler('args')).toThrowError('Fail');
  done();
});

test('createRPCHandler error in failure reducer', async done => {
  const expectedActions = ['start', 'success'];
  const handler = createRPCHandler({
    actions: {
      start: args => {
        return {type: 'start', payload: args};
      },
      success: result => {
        // $FlowFixMe
        done.fail('should not call success');
        return {type: 'success', payload: result};
      },
      failure: e => {
        throw new Error('Fail');
      },
    },
    store: {
      dispatch: action => {
        expect(action.type).toBe(expectedActions.shift());
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
  await expect(handler('args')).rejects.toThrow('Fail');
  done();
});

test('createRPCHandler failure', done => {
  const expectedActions = ['start', 'failure'];
  const error = new Error('fail');
  const handler = createRPCHandler({
    actions: {
      start: args => {
        expect(args).toBe('transformed-args');
        return {type: 'start', payload: args};
      },
      success: result => {
        // $FlowFixMe
        done.fail('should not call success');
        return {type: 'success', payload: result};
      },
      failure: e => {
        expect(e.message).toBe(error.message);
        expect(e.initialArgs).toEqual('transformed-args');
        return {type: 'failure', payload: e};
      },
    },
    store: {
      dispatch: action => {
        expect(action.type).toBe(expectedActions.shift());
      },
      getState: () => {
        return 'test-state';
      },
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        expect(rpcId).toBe('test');
        return Promise.reject(error);
      },
    },
    rpcId: 'test',
    mapStateToParams: state => {
      expect(state).toBe('test-state');
      return 'mapped-params';
    },
    transformParams: params => {
      expect(params).toBe('mapped-params');
      return 'transformed-args';
    },
  });
  const result = handler('args');
  expect(result instanceof Promise).toBeTruthy();
  result.then(reject => {
    expect(reject).toBe(error);
    done();
  });
});

test('createRPCHandler optional parameters', done => {
  const expectedActions = ['TEST_START', 'TEST_SUCCESS'];
  const handler = createRPCHandler({
    store: {
      dispatch: action => {
        expect(typeof action === 'object' && action.type).toBe(
          expectedActions.shift()
        );
      },
      getState: () => {},
      subscribe: () => () => {},
      replaceReducer: () => {},
    },
    rpc: {
      request: rpcId => {
        expect(rpcId).toBe('test');
        return Promise.resolve('response');
      },
    },
    rpcId: 'test',
  });
  const result = handler('args');
  expect(result instanceof Promise).toBeTruthy();
  result.then(response => {
    expect(response).toBe('response');
    done();
  });
});

test('createRPCReactors', done => {
  const reactors = createRPCReactors('getCount', {
    start() {},
    success() {},
    failure() {},
  });
  expect(typeof reactors.start).toBe('function');
  expect(typeof reactors.success).toBe('function');
  expect(typeof reactors.failure).toBe('function');
  if (!reactors.start) {
    // $FlowFixMe
    done.fail();
    done();
    return;
  }
  // $FlowFixMe
  const {type, payload} = reactors.start('test-payload');
  expect(type).toBe('GET_COUNT_START');
  expect(payload).toBe('test-payload');
  done();
});

test('createRPCReactors optional reducers', done => {
  const reactors = createRPCReactors('getCount', {});
  expect(typeof reactors.start).toBe('function');
  expect(typeof reactors.success).toBe('function');
  expect(typeof reactors.failure).toBe('function');
  if (!reactors.start) {
    // $FlowFixMe
    done.fail();
    done();
    return;
  }
  // $FlowFixMe
  const {type, payload} = reactors.start('test-payload');
  expect(type).toBe('GET_COUNT_START');
  expect(payload).toBe('test-payload');
  done();
});

test('createRPCActions', () => {
  const {start, success, failure} = createRPCActions('getCount');
  expect(start(5)).toStrictEqual({type: 'GET_COUNT_START', payload: 5});
  expect(success(5)).toStrictEqual({type: 'GET_COUNT_SUCCESS', payload: 5});
  expect(failure(5)).toStrictEqual({type: 'GET_COUNT_FAILURE', payload: 5});
});

test('createRPCReducer', () => {
  const reducer = createRPCReducer('getCount', {
    start: (state, action) => {
      expect(state).toBe('test-state');
      expect(action.type).toBe('GET_COUNT_START');
      expect(action.payload).toBe('test-action');
      return 'test-start';
    },
    success: (state, action) => {
      expect(state).toBe('test-state');
      expect(action.type).toBe('GET_COUNT_SUCCESS');
      expect(action.payload).toBe('test-action');
      return 'test-success';
    },
    failure: (state, action) => {
      expect(state).toBe('test-state');
      expect(action.type).toBe('GET_COUNT_FAILURE');
      expect(action.payload).toBe('test-action');
      return 'test-failure';
    },
  });

  expect(
    reducer('test-state', {
      type: 'GET_COUNT_START',
      payload: 'test-action',
    })
  ).toBe('test-start');
  expect(
    reducer('test-state', {
      type: 'GET_COUNT_SUCCESS',
      payload: 'test-action',
    })
  ).toBe('test-success');
  expect(
    reducer('test-state', {
      type: 'GET_COUNT_FAILURE',
      payload: 'test-action',
    })
  ).toBe('test-failure');
  expect(reducer('abcd', {type: 'abcd', payload: {}})).toBe('abcd');
});

test('createRPCReducer default reducers', () => {
  const reducer = createRPCReducer('getCount', {});
  const initialState = {a: 'b'};
  expect(reducer(initialState, {type: 'GET_COUNT_START', payload: {}})).toBe(
    initialState
  );
  expect(reducer(initialState, {type: 'GET_COUNT_SUCCESS', payload: {}})).toBe(
    initialState
  );
  expect(reducer(initialState, {type: 'GET_COUNT_FAILURE', payload: {}})).toBe(
    initialState
  );
});

test('createRPCReducer custom default state', () => {
  const initialState = 123;
  const reducer = createRPCReducer('getCount', {}, initialState);
  expect(reducer(initialState, {type: 'GET_COUNT_START', payload: {}})).toBe(
    initialState
  );
  expect(reducer(initialState, {type: 'GET_COUNT_SUCCESS', payload: {}})).toBe(
    initialState
  );
  expect(reducer(initialState, {type: 'GET_COUNT_FAILURE', payload: {}})).toBe(
    initialState
  );
});
