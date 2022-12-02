/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {useService} from './context';
import PropTypes from 'prop-types';
import type {Token} from 'fusion-core';

function capitalize(str: string): string {
  return str.replace(/^./, (c) => c.toUpperCase());
}

type ReactHOC = (a: React.ComponentType<any>) => React.ComponentType<any>;
export default {
  create: (
    name: string,
    mapProvidesToProps?: (a: any) => any,
    token?: Token<any>
  ): ReactHOC => {
    const mapProvides = mapProvidesToProps
      ? mapProvidesToProps
      : (provides) => ({[name]: provides});
    const _token = token; // Make token constant for flow
    if (_token) {
      // Use new Context through useService hook
      return (Component: React.ComponentType<any>) => {
        const Wrapper = (props?: {[x: string]: any}) => {
          const service = useService(_token);

          return React.createElement(Component, {
            ...props,
            ...mapProvides(service),
          });
        };
        const displayName =
          Component.displayName || Component.name || 'Anonymous';
        Wrapper.displayName = `With${capitalize(name)}(${displayName})`;
        return Wrapper;
      };
    } else {
      // Use legacy Context
      return (Component: React.ComponentType<any>) => {
        const displayName =
          Component.displayName || Component.name || 'Anonymous';

        class HOC extends React.Component<any> {
          provides: any;

          constructor(props: any, ctx: any) {
            super(props, ctx);
            this.provides = ctx[name];
          }
          render() {
            const props = {...this.props, ...mapProvides(this.provides)};
            return React.createElement(Component, props);
          }

          static displayName = `With${capitalize(name)}(${displayName})`;
          static contextTypes = {
            [name]: PropTypes.any.isRequired,
          };
        }
        return HOC;
      };
    }
  },
};
