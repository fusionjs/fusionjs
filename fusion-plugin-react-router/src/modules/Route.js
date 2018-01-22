/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {Route as ReactRouterRoute} from 'react-router-dom';

function Route(props, context) {
  const {trackingId, component, children, ...remainingProps} = props;
  if (remainingProps.render) {
    throw new Error('Cannot pass render function to tracking route');
  }
  return (
    <ReactRouterRoute
      {...remainingProps}
      render={renderProps => {
        const {match} = renderProps;
        if (match.isExact) {
          context.onRoute({
            page: match.path,
            title: trackingId || match.path,
          });
        }
        return component
          ? React.createElement(component, renderProps)
          : React.Children.only(children);
      }}
    />
  );
}

Route.contextTypes = {
  onRoute: PropTypes.func.isRequired,
};

export {Route};
