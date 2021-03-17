/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {prepared} from 'fusion-react';
import {withRPCRedux} from '../../../../..';

const CHILD_TRIP_ID = 456;

function Child(props) {
  if (props.isLoading) {
    return 'Loading...';
  }

  return (
    <div data-testid="child-trip-id">
      {props.lastTrip ? props.lastTrip.id : 'no trips'}
    </div>
  );
}

export default compose(
  withRPCRedux('getLastTrip'),
  connect(({ lastTrip }) => ({
    lastTrip: lastTrip.data,
    isLoading: lastTrip.loading
  })),
  prepared(props =>
    props.lastTrip
      ? Promise.resolve()
      : props.getLastTrip({tripId: CHILD_TRIP_ID})
  )
)(Child);
