/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable import/no-extraneous-dependencies */

import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Routes as ReactRouterRoutes,
  useLocation,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

import type {RouterContextType} from '../types.js';

type PropsType = {|
  children?: React.Node,
|};

function Routes(props: PropsType, context: RouterContextType) {
  const location = useLocation();
  const routeDataRef = React.useRef(null);
  const trackingIdMapRef = React.useRef(null);

  const runEffect = React.useCallback(() => {
    const routeData =
      routeDataRef.current || createRoutesFromChildren(props.children || []);
    if (!routeDataRef.current) {
      routeDataRef.current = routeData;
    }

    const trackingIdMap: {[string]: string} = trackingIdMapRef.current || {};
    if (!trackingIdMapRef.current) {
      const compileTracking = (children, currentPath) => {
        React.Children.forEach(children, (element) => {
          if (element.props.children) {
            compileTracking(
              element.props.children,
              currentPath + element.props.path + '/'
            );
          } else {
            const {path, trackingId} = element.props;
            if (path && trackingId) {
              trackingIdMap[currentPath + path] = trackingId;
            }
          }
        });
      };
      compileTracking(props.children || [], '');
      trackingIdMapRef.current = trackingIdMap;
    }

    const matches = matchRoutes(routeData, location);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        if (typeof context.onRoute === 'function') {
          // Convert match back to original pathname to look up in trackingIdMap
          // since the path in trackingIdMap has params while match data does not
          let translatedPathname = match.pathname;
          for (const key of Object.keys(match.params)) {
            const paramValue = match.params[key];
            // e.g.: pathname = '/user/abcd', params = { uuid: 'abcd' }
            // Replace abcd with :uuid
            translatedPathname = translatedPathname.replace(
              paramValue,
              `:${key}`
            );
          }

          context.onRoute({
            page: match.pathname,
            title: trackingIdMap[translatedPathname] || match.pathname,
            params: match.params,
          });
        }
      }
    }
  }, [context, location, props.children]);

  // Browser side runs route matching function on each location change
  React.useEffect(() => {
    runEffect();
  }, [location, runEffect]);

  // Server side runs only once on initial load
  if (__NODE__ && context.onRoute) {
    runEffect();
  }

  const {children, ...remainingProps} = props;
  return <ReactRouterRoutes {...remainingProps}>{children}</ReactRouterRoutes>;
}

Routes.contextTypes = {
  history: PropTypes.object,
  router: PropTypes.shape({
    staticContext: PropTypes.object,
  }),
  onRoute: PropTypes.func,
};

Routes.displayName = 'FusionRoutes';

export {Routes};
