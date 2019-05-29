/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import type {LocationShapeType, RedirectType} from '../types.js';

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
  router: {
    history: {
      push: (el: string | LocationShapeType) => void,
      replace: (el: string | LocationShapeType) => void,
    },
    staticContext?: {
      setCode: (code: number) => void,
      redirect: (el: string | LocationShapeType) => void,
    },
  },
};
export class Redirect extends React.Component<PropsType> {
  context: ContextType;

  constructor(props: PropsType, context: ContextType) {
    super(props, context);
    if (this.isStatic(context)) this.perform();
  }

  static defaultProps = {
    push: false,
    code: 307,
  };

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  isStatic(context: ContextType = this.context): boolean {
    return !!(context && context.router && context.router.staticContext);
  }

  perform() {
    const {history, staticContext} = this.context.router;
    const {push, to, code} = this.props;

    if (__NODE__ && staticContext) {
      staticContext.setCode(parseInt(code, 10));
      staticContext.redirect(to);
      return;
    }

    if (push) {
      history.push(to);
    } else {
      history.replace(to);
    }
  }

  render() {
    return null;
  }
}

Redirect.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
    }).isRequired,
    staticContext: PropTypes.object,
  }).isRequired,
};

// Sanity type checking
(Redirect: RedirectType);
