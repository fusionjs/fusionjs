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
  create: (name: string): React.ComponentType<any> => {
    class Provider extends React.Component<any> {
      getChildContext() {
        return {[name]: this.props.provides};
      }
      render() {
        return React.Children.only(this.props.children);
      }

      static childContextTypes = {
        [name]: PropTypes.any.isRequired,
      };

      static displayName =
        name.replace(/^./, (c) => c.toUpperCase()) + 'Provider';
    }
    return Provider;
  },
};
