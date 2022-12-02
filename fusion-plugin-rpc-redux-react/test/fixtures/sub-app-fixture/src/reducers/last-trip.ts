/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

import {createRPCReducer} from 'fusion-rpc-redux';

export const lastTripReducer = createRPCReducer('getLastTrip', {
  start: (state, action) => ({...state, loading: true}),
  success: (state, action) => ({
    ...state,
    loading: false,
    data: action.payload,
  }),
  failure: (state, action) => ({
    ...state,
    loading: false,
    error: action.payload.error,
  }),
});

export const lastTripInitialState = {loading: false, data: null, error: ''};
