/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

export default {
  create: (name: string) => {
    class Provider extends React.Component<*> {
      getChildContext() {
        return {[name]: this.props.provides};
      }
      render() {
        return React.Children.only(this.props.children);
      }
    }
    Provider.childContextTypes = {
      ...(Provider.childContextTypes || {}),
      [name]: PropTypes.any.isRequired,
    };
    Provider.displayName =
      name.replace(/^./, c => c.toUpperCase()) + 'Provider';

    return Provider;
  },
};
