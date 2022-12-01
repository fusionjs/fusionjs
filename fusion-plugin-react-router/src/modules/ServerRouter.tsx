/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import {Router as BaseRouter} from 'react-router-dom';

import type {RouterPropsType, RouterType} from '../types.js';

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
class ServerRouter extends React.Component<RouterPropsType> {
  static defaultProps = {
    basename: '',
    context: {},
    onRoute: () => {},
  };

  getRouterStaticContext() {
    let context = this.props.context;
    if (context && typeof context.setCode === 'function') {
      console.warn(
        'Using context.setCode is deprecated. Use a setter on the status prop instead'
      );
      Object.defineProperty(context, 'status', {
        set: (code) => {
          if (context.setCode) context.setCode(code);
        },
        configurable: true,
      });
    }
    if (context && typeof context.redirect === 'function') {
      console.warn(
        'Using context.redirect is deprecated. Use a setter on the url prop instead'
      );
      Object.defineProperty(context, 'url', {
        set: (url) => {
          if (context.redirect) context.redirect(url);
        },
        configurable: true,
      });
    }
    return context || {};
  }

  getChildContext() {
    return {
      history: this.props.history,
      router: {
        staticContext: this.getRouterStaticContext(),
      },
      onRoute: (routeData: any) =>
        this.props.onRoute && this.props.onRoute(routeData),
    };
  }

  render() {
    const {history, basename, children} = this.props;
    return (
      <BaseRouter
        basename={basename}
        location={history.location}
        navigator={history}
        static={true}
      >
        {children}
      </BaseRouter>
    );
  }
}

ServerRouter.childContextTypes = {
  history: PropTypes.object,
  router: PropTypes.shape({
    staticContext: PropTypes.object,
  }),
  onRoute: () => {},
};

const ServerRouterTyped: RouterType = ServerRouter;
export {ServerRouterTyped as ServerRouter};
