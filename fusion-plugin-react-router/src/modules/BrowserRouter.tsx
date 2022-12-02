/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import {unstable_HistoryRouter as BaseRouter} from 'react-router-dom';
import compare from 'just-compare';

import type {RouterPropsType, RouterType} from '../types';

export {Status, NotFound} from './Status';
export {Navigate} from './Navigate';

type ContextType = {
  __IS_PREPARE__: boolean;
};

class BrowserRouter extends React.Component<RouterPropsType> {
  lastTitle: string | undefined | null;
  lastParams: {};
  context: ContextType;

  static defaultProps = {
    onRoute: () => {},
  };

  constructor(props: RouterPropsType, context: ContextType) {
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
    const {history, basename} = this.props;
    return (
      <BaseRouter basename={basename} history={history}>
        {this.props.children}
      </BaseRouter>
    );
  }
}

BrowserRouter.propTypes = {
  basename: PropTypes.string,
  children: PropTypes.node,
  history: PropTypes.object,
  onRoute: PropTypes.func,
};

BrowserRouter.contextTypes = {
  __IS_PREPARE__: PropTypes.bool,
};

BrowserRouter.childContextTypes = {
  onRoute: PropTypes.func.isRequired,
};

const BrowserRouterTyped: RouterType = BrowserRouter;
export {BrowserRouterTyped as Router};
