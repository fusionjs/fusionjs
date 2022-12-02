/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable import/no-extraneous-dependencies */

import * as React from 'react';
import PropTypes from 'prop-types';
import {Navigate as NavigateComponent} from 'react-router-dom';

import type {TTo} from '../types';

type PropsType = {
  to: TTo;
  replace?: boolean;
  code?: number | string;
};

export class Navigate extends React.Component<PropsType> {
  static defaultProps = {
    to: '',
    replace: true,
    code: 307,
  };

  render() {
    const staticContext =
      // @ts-expect-error todo(flow->ts) missing types for this.context
      this.context.router && this.context.router.staticContext;
    // @ts-expect-error todo(flow->ts) missing types for this.context
    const history = this.context.history;

    // Redirect (Navigate in RR6) was removed for server side redirects
    // https://gist.github.com/mjackson/b5748add2795ce7448a366ae8f8ae3bb
    // This implementation preserves the RR5 behavior for backwards compatibility
    if (__NODE__ && staticContext && history) {
      // @ts-expect-error todo(flow->ts) number in parseInt
      staticContext.status = parseInt(this.props.code, 10);
      history[this.props.replace ? 'replace' : 'push'](this.props.to);
      return null;
    }
    const {code, ...rest} = this.props;
    return <NavigateComponent {...rest} />;
  }

  static contextTypes = {
    history: PropTypes.object,
    router: PropTypes.shape({
      staticContext: PropTypes.object,
    }),
  };
}
