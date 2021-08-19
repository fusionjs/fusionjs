/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ReactorAction} from 'redux-reactors';
import {Reducer, Store} from 'redux';

declare type ActionType = {
  type: string;
  payload: any;
};
declare type RPCReactorsType<TType, TPayload> = {
  start: ReactorAction<TType, TPayload>;
  success: ReactorAction<TType, TPayload>;
  failure: ReactorAction<TType, TPayload>;
};
declare type RPCReducersType<S, A extends ActionType> = {
  start?: Reducer<S, A>;
  success?: Reducer<S, A>;
  failure?: Reducer<S, A>;
};
declare type ActionNamesType = {
  failure: string;
  start: string;
  success: string;
};
declare type ActionTypesType = keyof ActionNamesType;
declare type Action<TType, TPayload> = {
  type: TType;
  payload: TPayload;
};
declare type RPCActionsType = {
  [T in ActionTypesType]: (payload: any) => Action<string, any>;
};
declare function createRPCActions(rpcId: string): RPCActionsType;
declare function createRPCReducer<S, A extends ActionType>(
  rpcId: string,
  reducers: RPCReducersType<S, A>,
  startValue?: S
): Reducer<S, A>;
declare function createRPCReactors<S, A extends ActionType>(
  rpcId: string,
  reducers: RPCReducersType<S, A>
): RPCReactorsType<any, any>;
declare type RPCHandlerType = (args: any) => any;
declare function createRPCHandler({
  actions,
  store,
  rpc,
  rpcId,
  mapStateToParams,
  transformParams,
}: {
  actions?: RPCActionsType;
  store: Store<any, any>;
  rpc: any;
  rpcId: string;
  mapStateToParams?: (state: any, args?: any) => any;
  transformParams?: (params: any) => any;
}): RPCHandlerType;

export {
  ActionType,
  createRPCActions,
  createRPCHandler,
  createRPCReactors,
  createRPCReducer,
};
