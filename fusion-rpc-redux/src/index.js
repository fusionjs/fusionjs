/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import {createReactor} from 'redux-reactors';

function camelUpper(key) {
  return key.replace(/([A-Z])/g, '_$1').toUpperCase();
}

const noopReducer = state => state;
const types = ['start', 'success', 'failure'];

function createActionNames(rpcId) {
  const rpcActionName = camelUpper(rpcId);
  return types.reduce((names, type) => {
    names[type] = `${rpcActionName}_${type.toUpperCase()}`;
    return names;
  }, {});
}

export function createRPCActions(rpcId: String) {
  const actionNames = createActionNames(rpcId);
  return types.reduce((obj, type) => {
    obj[type] = (payload: any) => {
      return {type: actionNames[type], payload};
    };
    return obj;
  }, {});
}

function getNormalizedReducers(reducers) {
  return types.reduce((obj, type) => {
    obj[type] = reducers[type] || noopReducer;
    return obj;
  }, {});
}

export function createRPCReducer(
  rpcId: String,
  reducers: any,
  startValue: any = {}
) {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);

  return function rpcReducer(state: * = startValue, action: any) {
    if (actionNames.start === action.type) {
      return reducers.start(state, action);
    }
    if (actionNames.success === action.type) {
      return reducers.success(state, action);
    }
    if (actionNames.failure === action.type) {
      return reducers.failure(state, action);
    }
    return state;
  };
}

export function createRPCReactors(rpcId: String, reducers: any) {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);
  const reactors = types.reduce((obj, type) => {
    obj[type] = createReactor(actionNames[type], reducers[type]);
    return obj;
  }, {});
  return reactors;
}

export function createRPCHandler({
  actions,
  store,
  rpc,
  rpcId,
  mapStateToParams,
  transformParams,
}: any) {
  if (!actions) {
    actions = createRPCActions(rpcId);
  }
  return (args: any) => {
    if (mapStateToParams) {
      args = mapStateToParams(store.getState());
    }
    if (transformParams) {
      args = transformParams(args);
    }
    store.dispatch(actions.start(args));
    return rpc
      .request(rpcId, args)
      .then(result => {
        store.dispatch(actions.success(result));
        return result;
      })
      .catch(e => {
        // error objects stringify to {} by default, so we should pluck the properties we care about
        const {message, code, meta} = e;
        store.dispatch(actions.failure({message, code, meta}));
        return e;
      });
  };
}
