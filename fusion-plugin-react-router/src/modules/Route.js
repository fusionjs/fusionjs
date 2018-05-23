/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import {Route as ReactRouterRoute} from 'react-router-dom';

const isEmptyChildren = children => React.Children.count(children) === 0;

function Route(props: any, context: any) {
  const {trackingId, component, render, children, ...remainingProps} = props;

  return (
    <ReactRouterRoute
      {...remainingProps}
      // eslint-disable-next-line react/no-children-prop
      children={routeProps => {
        const {match} = routeProps;
        if (match && match.isExact) {
          context.onRoute({
            page: match.path,
            title: trackingId || match.path,
          });
        }

        if (component)
          return match ? React.createElement(component, routeProps) : null;

        if (render) return match ? render(routeProps) : null;

        if (typeof children === 'function') return children(routeProps);

        if (children && !isEmptyChildren(children))
          return React.Children.only(children);

        return null;
      }}
    />
  );
}

Route.contextTypes = {
  onRoute: PropTypes.func.isRequired,
};

Route.displayName = 'FusionRoute';

export {Route};
