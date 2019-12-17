/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import React, {useEffect, useState} from 'react';
import {createStore, compose, combineReducers} from 'redux';
import {Provider, connect} from 'react-redux';
import {prepared} from 'fusion-react';
import {lastTripReducer, lastTripInitialState} from '../reducers/last-trip.js';
import Child from './child.js';
import {withRPCRedux} from '../../../../..';

const PARENT_TRIP_ID = 123;

function Root(props) {
  const [store, setStore] = useState(null);

  useEffect(() => {
    const store = createStore(combineReducers({lastTrip: lastTripReducer}), {
      lastTrip: lastTripInitialState,
    });
    setStore(store);
  }, []);

  return (
    <div>
      <div data-testid="parent-trip-id">
        {props.lastTrip ? props.lastTrip.id : 'no trips'}
      </div>
      {store && (
        <Provider store={store}>
          <Child />
        </Provider>
      )}
    </div>
  );
}

export default compose(
  withRPCRedux('getLastTrip'),
  connect(({lastTrip}) => ({lastTrip: lastTrip.data})),
  prepared(props =>
    props.lastTrip
      ? Promise.resolve()
      : props.getLastTrip({tripId: PARENT_TRIP_ID})
  )
)(Root);
