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
import compare from 'just-compare';

import type {RouterPropsType as PropsType, RouterType} from '../types.js';

export {Status, NotFound} from './Status.js';
export {Redirect} from './Redirect.js';

type ContextType = {
  __IS_PREPARE__: boolean,
};
class BrowserRouter extends React.Component<PropsType> {
  lastTitle: ?string;
  lastParams: {};
  context: ContextType;

  static defaultProps = {
    onRoute: () => {},
    Provider: BaseRouter,
  };

  constructor(props: PropsType, context: ContextType) {
    super(props, context);
    this.lastTitle = null;
  }

  getChildContext() {
    const {__IS_PREPARE__} = this.context;
    return {
      onRoute: (routeData: any) => {
        if (
          !__IS_PREPARE__ &&
          (routeData.title !== this.lastTitle ||
            !compare(routeData.params, this.lastParams))
        ) {
          this.lastTitle = routeData.title;
          this.lastParams = routeData.params;
          this.props.onRoute && this.props.onRoute(routeData);
        }
      },
    };
  }

  render() {
    const {Provider, history, basename} = this.props;
    if (!Provider) throw new Error('Missing Provider for Browser Router');
    return (
      // $FlowFixMe
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

const BrowserRouterTyped: RouterType = BrowserRouter;
export {BrowserRouterTyped as Router};
