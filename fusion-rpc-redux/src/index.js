/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createReactor} from 'redux-reactors';
import type {Reactor} from 'redux-reactors';
import type {Reducer, Store} from 'redux';

function camelUpper(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toUpperCase();
}

const noopReducer: Reducer<*, *> = state => state;

type ActionNamesType = {failure: string, start: string, success: string};
type ActionTypesType = $Keys<ActionNamesType>;
const types: Array<ActionTypesType> = ['start', 'success', 'failure'];

function createActionNames(rpcId: string): ActionNamesType {
  const rpcActionName = camelUpper(rpcId);
  return types.reduce((names, type) => {
    names[type] = `${rpcActionName}_${type.toUpperCase()}`;
    return names;
  }, {});
}

type Action<TType, TPayload> =
  | {
      type: TType,
      payload: TPayload,
    }
  | TType;
type ConvertToAction = <T>(T) => (payload: any) => Action<T, *>;
type RPCActionsType = $ObjMap<ActionNamesType, ConvertToAction>;
export function createRPCActions(rpcId: string): RPCActionsType {
  const actionNames = createActionNames(rpcId);
  return types.reduce((obj, type) => {
    obj[type] = (payload: any) => {
      return {type: actionNames[type], payload};
    };
    return obj;
  }, {});
}

type RPCReducersType = {
  start?: Reducer<*, *>,
  success?: Reducer<*, *>,
  failure?: Reducer<*, *>,
};
function getNormalizedReducers(reducers: RPCReducersType): RPCReducersType {
  return types.reduce((obj, type) => {
    obj[type] = reducers[type] || noopReducer;
    return obj;
  }, {});
}

export function createRPCReducer(
  rpcId: string,
  reducers: RPCReducersType,
  startValue: any = {}
): Reducer<*, *> {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);

  return function rpcReducer(state: * = startValue, action: any) {
    if (actionNames.start === action.type) {
      return reducers.start && reducers.start(state, action);
    }
    if (actionNames.success === action.type) {
      return reducers.success && reducers.success(state, action);
    }
    if (actionNames.failure === action.type) {
      return reducers.failure && reducers.failure(state, action);
    }
    return state;
  };
}

type RPCReactorsType = {
  start?: Reactor<*, *>,
  success?: Reactor<*, *>,
  failure?: Reactor<*, *>,
};
export function createRPCReactors(
  rpcId: string,
  reducers: RPCReducersType
): RPCReactorsType {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);
  const reactors = types.reduce((obj, type) => {
    if (!reducers[type]) {
      throw new Error(`Missing reducer for type ${type}`);
    }
    obj[type] = createReactor(actionNames[type], reducers[type]);
    return obj;
  }, {});
  return reactors;
}

// TODO 2018-05-10 - Improve type definition for RPCHandlerType
type RPCHandlerType = (args: any) => any;
export function createRPCHandler({
  actions,
  store,
  rpc,
  rpcId,
  mapStateToParams,
  transformParams,
}: {
  actions?: RPCActionsType,
  store: Store<*, *, *>,
  rpc: any,
  rpcId: string,
  mapStateToParams?: any,
  transformParams?: any,
}): RPCHandlerType {
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
    store.dispatch(actions && actions.start(args));
    return rpc
      .request(rpcId, args)
      .then(result => {
        store.dispatch(actions && actions.success(result));
        return result;
      })
      .catch(e => {
        const error = Object.getOwnPropertyNames(e).reduce((obj, key) => {
          obj[key] = e[key];
          return obj;
        }, {});
        delete error.stack;
        store.dispatch(actions && actions.failure(error));
        return e;
      });
  };
}
