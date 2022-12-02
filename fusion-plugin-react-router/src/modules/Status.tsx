/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import type {RouterContextType} from '../types';
import PropTypes from 'prop-types';

type StatusPropsType = {
  children: React.ReactNode;
  code?: string | number;
};

export class Status extends React.Component<StatusPropsType> {
  constructor(props: StatusPropsType, context: RouterContextType) {
    super(props, context);
    const {router: {staticContext} = {}} = context;
    if (staticContext) {
      staticContext.status = parseInt(this.props.code, 10);
    }
  }

  render() {
    return this.props.children;
  }
}

Status.contextTypes = {
  router: PropTypes.shape({
    staticContext: PropTypes.object,
  }),
};

export const NotFound = <
  TProps extends {
    children: React.ReactNode;
  }
>(
  props: TProps
) => <Status code={404}>{props.children}</Status>;
