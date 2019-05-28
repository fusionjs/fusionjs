/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

// $FlowFixMe
import {__RouterContext as RouterContext} from 'react-router-dom';

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

type HistoryContextType = {
  push: (el: string | LocationShapeType) => void,
  replace: (el: string | LocationShapeType) => void,
};

type StaticContextType = {
  setCode: (code: number) => void,
  redirect: (el: string | LocationShapeType) => void,
};

type ContextType = {
  router?: {
    staticContext?: StaticContextType,
  },
};

class Lifecycle extends React.Component<{
  onConstruct?: () => void,
  onMount?: () => void,
}> {
  constructor(props) {
    super(props);
    if (this.props.onConstruct) this.props.onConstruct.call(this, this);
  }
  componentDidMount() {
    if (this.props.onMount) this.props.onMount.call(this, this);
  }
  render() {
    return null;
  }
}

export class Redirect extends React.Component<PropsType> {
  context: ContextType;

  static defaultProps = {
    push: false,
    code: 307,
  };

  isStatic(context: ContextType = this.context): boolean {
    return !!(context && context.router && context.router.staticContext);
  }

  perform(history: HistoryContextType, staticContext: ?StaticContextType) {
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
    return (
      <RouterContext.Consumer>
        {context => {
          const history = context.history;
          const staticContext =
            this.context.router && this.context.router.staticContext;
          const perform = () => this.perform(history, staticContext);

          const props = this.isStatic()
            ? {onConstruct: perform}
            : {onMount: perform};

          return <Lifecycle {...props} />;
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
