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
import {Redirect as RedirectComponent} from 'react-router-dom';

// `react-router` installed by `react-router-dom`
// $FlowFixMe
import {__RouterContext as RouterContext} from 'react-router';

import type {
  LocationShapeType,
  RedirectType,
  StaticContextType,
} from '../types.js';

type PropsType = {|
  to: string | LocationShapeType,
  push?: boolean,
  from?: string,
  exact?: boolean,
  strict?: boolean,
  code?: number | string,
  children?: React.Node,
|};

type ContextType = {
  router?: {
    staticContext?: StaticContextType,
  },
};

export class Redirect extends React.Component<PropsType> {
  context: ContextType;

  static defaultProps = {
    push: false,
    code: 307,
  };

  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          const staticContext =
            this.context.router && this.context.router.staticContext;

          if (__NODE__ && staticContext) {
            staticContext.status = parseInt(this.props.code, 10);
          }

          const {children, code, ...rest} = this.props;
          return <RedirectComponent {...rest} />;
        }}
      </RouterContext.Consumer>
    );
  }
}

Redirect.contextTypes = {
  router: PropTypes.shape({
    staticContext: PropTypes.object,
  }),
};

// Sanity type checking
(Redirect: RedirectType);
