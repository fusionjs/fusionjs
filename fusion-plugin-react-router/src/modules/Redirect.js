/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

export class Redirect extends React.Component {
  componentWillMount() {
    if (this.isStatic()) this.perform();
  }

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  isStatic() {
    return this.context.router && this.context.router.staticContext;
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

Redirect.defaultProps = {
  push: false,
  code: 307,
};

Redirect.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
    }).isRequired,
    staticContext: PropTypes.object,
  }).isRequired,
};
