/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Reducer, StoreEnhancer} from 'redux';

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {GetInitialStateType, ReactReduxServiceType} from './types';

export const ReduxToken: Token<ReactReduxServiceType> =
  createToken('ReduxToken');
export const ReducerToken: Token<Reducer<any, any>> =
  createToken('ReducerToken');
export const PreloadedStateToken: Token<any> = createToken(
  'PreloadedStateToken'
);
export const EnhancerToken: Token<StoreEnhancer<any, any, any>> =
  createToken('EnhancerToken');
export const ReduxDevtoolsConfigToken: Token<{} | false> = createToken(
  'ReduxDevtoolsConfigToken'
);
export const GetInitialStateToken: Token<GetInitialStateType<any>> =
  createToken('GetInitialStateToken');
