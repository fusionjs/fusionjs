/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import {Router as BaseRouter} from 'react-router-dom';

import type {RouterPropsType as PropsType, RouterType} from '../types.js';

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
class ServerRouter extends React.Component<PropsType> {
  static defaultProps = {
    basename: '',
    context: {},
    Provider: BaseRouter,
    onRoute: () => {},
  };

  getRouterStaticContext() {
    let context = this.props.context;
    if (context && typeof context.setCode === 'function') {
      console.warn(
        'Using context.setCode is deprecated. Use a setter on the status prop instead'
      );
      Object.defineProperty(context, 'status', {
        set: code => {
          context.setCode(code);
        },
        configurable: true,
      });
    }
    if (context && typeof context.redirect === 'function') {
      console.warn(
        'Using context.redirect is deprecated. Use a setter on the url prop instead'
      );
      Object.defineProperty(context, 'url', {
        set: url => {
          context.redirect(url);
        },
        configurable: true,
      });
    }
    return context || {};
  }

  getChildContext() {
    return {
      router: {
        staticContext: this.getRouterStaticContext(),
      },
      onRoute: (routeData: any) =>
        this.props.onRoute && this.props.onRoute(routeData),
    };
  }

  render() {
    const {Provider, history, basename, children} = this.props;
    if (!Provider) throw new Error('Missing Provider for Server Router');
    return (
      // $FlowFixMe
      <Provider
        basename={basename}
        history={history}
        staticContext={this.getRouterStaticContext()}
      >
        {children}
      </Provider>
    );
  }
}

ServerRouter.childContextTypes = {
  router: () => {},
  onRoute: () => {},
};

const ServerRouterTyped: RouterType = ServerRouter;
export {ServerRouterTyped as ServerRouter};
