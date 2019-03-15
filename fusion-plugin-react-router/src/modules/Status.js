/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

type StatusPropsType = {
  children: React.Node,
  code?: string | number,
};
type StatusContextType = {
  router?: {
    staticContext: {
      setCode: (code: number) => void,
    },
  },
};
export class Status extends React.Component<StatusPropsType> {
  constructor(props: StatusPropsType, context: StatusContextType) {
    super(props, context);
    const {router: {staticContext} = {}} = context;
    if (staticContext && staticContext.setCode) {
      staticContext.setCode(parseInt(this.props.code, 10));
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

export const NotFound = <TProps: {children: React.Node}>(props: TProps) => (
  <Status code={404}>{props.children}</Status>
);
