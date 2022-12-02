/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

import {combineReducers} from 'redux';
import {lastTripReducer} from './reducers/last-trip';

export default combineReducers({
  lastTrip: lastTripReducer,
});
