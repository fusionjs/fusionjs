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

export {Status, NotFound} from './Status';
export {Redirect} from './Redirect';

class BrowserRouter extends React.Component<any> {
  lastTitle: any;

  constructor(props: any = {}, context: any) {
    super(props, context);
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
    const {Provider, history, basename} = this.props;
    return (
      <Provider basename={basename} history={history}>
        {this.props.children}
      </Provider>
    );
  }
}

BrowserRouter.propTypes = {
  children: PropTypes.node,
  onRoute: PropTypes.func,
  history: PropTypes.object,
  Provider: PropTypes.any,
  basename: PropTypes.string,
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
  Provider: BaseRouter,
};

export {BrowserRouter as Router};
