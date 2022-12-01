/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Store } from "redux";

import type { Context } from "fusion-core";

import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  GetInitialStateToken,
} from "./tokens";

export type GetInitialStateType<TState> = (
  ctx: Context
) => Promise<TState> | TState;

export type StoreWithContextType<S, A, D> = Store<S, A, D> & {
  ctx: Context;
};

export type ReactReduxDepsType = {
  reducer: typeof ReducerToken;
  preloadedState: typeof PreloadedStateToken.optional;
  enhancer: typeof EnhancerToken.optional;
  getInitialState: typeof GetInitialStateToken.optional;
};

export type ReactReduxServiceType = {
  from: (ctx?: Context) => {
    ctx?: Context;
    store: StoreWithContextType<any, any, any>;
    initStore?: () => Promise<StoreWithContextType<any, any, any>>;
  };
};
