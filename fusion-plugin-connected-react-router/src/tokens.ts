/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createToken} from 'fusion-core';

import type {Token} from 'fusion-core';
import type {StoreEnhancer} from 'redux';

export const ConnectedRouterEnhancerToken: Token<StoreEnhancer<any, any, any>> =
  createToken('ConnectedRouterEnhancer');
