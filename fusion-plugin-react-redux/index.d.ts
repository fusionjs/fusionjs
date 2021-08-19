/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as redux from 'redux';
import {Reducer, StoreEnhancer, Action, Store} from 'redux';
import * as fusion_core from 'fusion-core';
import {Token, Context} from 'fusion-core';

declare const ReduxToken: Token<ReactReduxServiceType>;
declare const ReducerToken: Token<Reducer<any, any>>;
declare const PreloadedStateToken: Token<any>;
declare const EnhancerToken: Token<StoreEnhancer<any, any>>;
declare const ReduxDevtoolsConfigToken: Token<{} | false>;
declare const GetInitialStateToken: Token<GetInitialStateType<any>>;

declare type GetInitialStateType<TState> = (
  ctx: Context
) => Promise<TState> | TState;
declare type StoreWithContextType<S, A extends Action> = Store<S, A> & {
  ctx: Context;
};
declare type ReactReduxDepsType = {
  reducer: typeof ReducerToken;
  preloadedState: typeof PreloadedStateToken.optional;
  enhancer: typeof EnhancerToken.optional;
  getInitialState: typeof GetInitialStateToken.optional;
};
declare type ReactReduxServiceType = {
  from: (ctx?: Context) => {
    ctx?: Context;
    store: StoreWithContextType<any, any>;
    initStore?: () => Promise<StoreWithContextType<any, any>>;
  };
};

declare const _default:
  | fusion_core.FusionPlugin<
      {
        reducer: fusion_core.Token<redux.Reducer<any, any>>;
        preloadedState: fusion_core.Token<any>;
        enhancer: fusion_core.Token<redux.StoreEnhancer<any, any>>;
        reduxDevToolsConfig: fusion_core.Token<false | {}>;
      },
      ReactReduxServiceType
    >
  | fusion_core.FusionPlugin<ReactReduxDepsType, ReactReduxServiceType>;

export {
  EnhancerToken,
  GetInitialStateToken,
  GetInitialStateType,
  PreloadedStateToken,
  ReactReduxDepsType,
  ReactReduxServiceType,
  ReducerToken,
  ReduxDevtoolsConfigToken,
  ReduxToken,
  StoreWithContextType,
  _default as default,
};
