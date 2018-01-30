/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createToken, createOptionalToken} from 'fusion-tokens';

export const ReduxToken = createToken('ReduxToken');
export const ReducerToken = createToken('ReducerToken');
export const PreloadedStateToken = createOptionalToken(
  'PreloadedStateToken',
  null
);
export const EnhancerToken = createOptionalToken('EnhancerToken', null);
export const InitialStateToken = createOptionalToken('InitialStateToken', null);
