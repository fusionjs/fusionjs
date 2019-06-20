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


import {
  Router,
  Route,
  Link,
  Switch,
  NotFound,
} from 'fusion-plugin-react-router';


function Root(props) {
  return (
    <div>
      <Link to="/test">
        <div id="go-to-test">Test</div>
      </Link>
      <div id="path" data-testid="path">
        {props.router.location.pathname}
      </div>
    </div>
  );
}

// export default Root;
export default connect(({router}) => ({router}))(Root);
