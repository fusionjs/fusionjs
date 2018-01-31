/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

export default {
  create: (name, mapProvidesToProps) => {
    if (!mapProvidesToProps) {
      mapProvidesToProps = provides => ({[name]: provides});
    }
    return Component => {
      class HOC extends React.Component {
        constructor(props, ctx) {
          super(props, ctx);
          this.provides = ctx[name];
        }
        render() {
          const props = {...this.props, ...mapProvidesToProps(this.provides)};
          return React.createElement(Component, props);
        }
      }
      const displayName = Component.displayName || Component.name;
      HOC.displayName =
        'With' +
        name.replace(/^./, c => c.toUpperCase()) +
        '(' +
        displayName +
        ')';
      HOC.contextTypes = {
        [name]: PropTypes.any.isRequired,
      };
      return HOC;
    };
  },
};
