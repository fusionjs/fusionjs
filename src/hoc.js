/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useService} from './context.js';
import PropTypes from 'prop-types';
import type {Token} from 'fusion-core';

function capitalize(str: string): string {
  return str.replace(/^./, c => c.toUpperCase());
}

type ReactHOC = (React.ComponentType<*>) => React.ComponentType<*>;
export default {
  create: (
    name: string,
    mapProvidesToProps?: Object => Object,
    token?: Token<*>
  ): ReactHOC => {
    const mapProvides = mapProvidesToProps
      ? mapProvidesToProps
      : provides => ({[name]: provides});
    const _token = token; // Make token constant for flow
    if (_token) {
      // Use new Context through useService hook
      return (Component: React.ComponentType<*>) => {
        const Wrapper = (props?: {[string]: any}) => {
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
        const displayName =
          Component.displayName || Component.name || 'Anonymous';
        HOC.displayName = `With${capitalize(name)}(${displayName})`;
        HOC.contextTypes = {
          [name]: PropTypes.any.isRequired,
        };
        return HOC;
      };
    }
  },
};
