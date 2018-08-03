/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {Router} from 'react-router-dom';

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
export class ServerRouter extends React.Component<any> {
  getChildContext() {
    return {
      router: {
        staticContext: this.props.context || {},
      },
      onRoute: (routeData: any) => this.props.onRoute(routeData),
    };
  }

  render() {
    const {Provider, history, basename, children} = this.props;
    return (
      <Provider basename={basename} history={history}>
        {children}
      </Provider>
    );
  }
}

// $FlowFixMe
ServerRouter.defaultProps = {
  basename: '',
  context: {},
  Provider: Router,
  onRoute: () => {},
};

ServerRouter.childContextTypes = {
  router: () => {},
  onRoute: () => {},
};
