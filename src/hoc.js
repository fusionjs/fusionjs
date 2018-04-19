/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import PropTypes from 'prop-types';

type ReactHOC = (React.ComponentType<*>) => React.ComponentType<*>;
export default {
  create: (name: string, mapProvidesToProps?: Object => Object): ReactHOC => {
    const mapProvides = mapProvidesToProps
      ? mapProvidesToProps
      : provides => ({[name]: provides});
    return (Component: React.ComponentType<*>) => {
      class HOC extends React.Component<*> {
        provides: any;

        constructor(props: *, ctx: *) {
          super(props, ctx);
          this.provides = ctx[name];
        }
        render() {
          const props = {...this.props, ...mapProvides(this.provides)};
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
