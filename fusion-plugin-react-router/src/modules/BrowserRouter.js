/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import {Router as BaseRouter} from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

export {Status, NotFound} from './Status';
export {Redirect} from './Redirect';

class BrowserRouter extends React.Component<any> {
  history: any;
  lastTitle: any;

  constructor(props: any = {}, context: any) {
    super(props, context);
    this.history = createHistory(this.props);
    this.lastTitle = null;
  }

  getChildContext() {
    const {__IS_PREPARE__} = this.context;
    return {
      onRoute: (routeData: any) => {
        if (routeData.title !== this.lastTitle && !__IS_PREPARE__) {
          this.lastTitle = routeData.title;
          this.props.onRoute(routeData);
        }
      },
    };
  }

  render() {
    return (
      <BaseRouter history={this.history}>{this.props.children}</BaseRouter>
    );
  }
}

BrowserRouter.propTypes = {
  basename: PropTypes.string,
  forceRefresh: PropTypes.bool,
  getUserConfirmation: PropTypes.func,
  keyLength: PropTypes.number,
  children: PropTypes.node,
  onRoute: PropTypes.func,
};

BrowserRouter.contextTypes = {
  __IS_PREPARE__: PropTypes.bool,
};

BrowserRouter.childContextTypes = {
  onRoute: PropTypes.func.isRequired,
};

// $FlowFixMe
BrowserRouter.defaultProps = {
  onRoute: () => {},
};

export {BrowserRouter as Router};
