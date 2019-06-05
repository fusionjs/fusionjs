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
import {withRPCRedux} from '../../..';

function Root(props) {
  return (
    <div id="user" data-testid="user-id">
      {props.user.id}
    </div>
  );
}

export default compose(
  withRPCRedux('getUser'),
  connect(({user}) => ({user: user.data})),
  prepared(props =>
    props.user ? Promise.resolve() : props.getUser({name: 'hello'})
  )
)(Root);
