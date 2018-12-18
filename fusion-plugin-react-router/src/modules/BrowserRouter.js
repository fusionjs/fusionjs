/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import {Router as BaseRouterUntyped} from 'react-router-dom';

import type {RouterType, RouterHistoryType} from '../types.js';

export {Status, NotFound} from './Status.js';
export {Redirect} from './Redirect.js';

const BaseRouter: RouterType = (BaseRouterUntyped: any);

type PropsType = {|
  context?: any,
  onRoute?: Function,
  history: RouterHistoryType,
  Provider?: RouterType,
  basename?: string,
  children?: React.Node,
|};
type ContextType = {
  __IS_PREPARE__: boolean,
};
class BrowserRouter extends React.Component<PropsType> {
  lastTitle: ?string;
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
        if (routeData.title !== this.lastTitle && !__IS_PREPARE__) {
          this.lastTitle = routeData.title;
          this.props.onRoute && this.props.onRoute(routeData);
        }
      },
    };
  }

  render() {
    const {Provider, history, basename} = this.props;
    if (!Provider) throw new Error('Missing Provider for Browser Router');
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

const BrowserRouterTyped: React.ComponentType<PropsType> = BrowserRouter;
export {BrowserRouterTyped as Router};
