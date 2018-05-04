/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Reducer, StoreEnhancer, Store} from 'redux';

import {createToken} from 'fusion-core';
import type {FusionPlugin, Token, Context} from 'fusion-core';

import type {ReactReduxDepsType, ReactReduxServiceType} from './types.js';

type InitialStateType<S, A, D> = (ctx?: Context) => Promise<Store<S, A, D>>;

export const ReduxToken: Token<
  FusionPlugin<ReactReduxDepsType, ReactReduxServiceType>
> = createToken('ReduxToken');
export const ReducerToken: Token<Reducer<*, *>> = createToken('ReducerToken');
export const PreloadedStateToken: Token<Object> = createToken(
  'PreloadedStateToken'
);
export const EnhancerToken: Token<StoreEnhancer<*, *, *>> = createToken(
  'EnhancerToken'
);
export const GetInitialStateToken: Token<
  InitialStateType<*, *, *>
> = createToken('GetInitialStateToken');
