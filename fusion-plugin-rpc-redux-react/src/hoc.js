/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import React from 'react';
import {createRPCHandler, createRPCReactors} from 'fusion-rpc-redux';

export const withRPCReactor = (
  rpcId,
  reactors,
  {propName, transformParams, mapStateToParams} = {}
) => {
  return withRPCRedux(rpcId, {
    actions: createRPCReactors(rpcId, reactors),
    propName,
    rpcId,
    transformParams,
    mapStateToParams,
  });
};

export function withRPCRedux(
  rpcId,
  {propName, actions, transformParams, mapStateToParams} = {}
) {
  if (!propName) {
    propName = rpcId;
  }
  return Component => {
    class withRPCRedux extends React.Component {
      render() {
        const {rpc, store} = this.context;
        const handler = createRPCHandler({
          rpcId,
          rpc: rpc.from(this.props.ctx),
          store,
          actions,
          mapStateToParams,
          transformParams,
        });
        const props = {
          ...this.props,
          [propName]: handler,
        };
        return React.createElement(Component, props);
      }
    }
    const displayName = Component.displayName || Component.name;
    withRPCRedux.displayName = 'WithRPCRedux' + '(' + displayName + ')';
    withRPCRedux.contextTypes = {
      rpc: PropTypes.object.isRequired,
      store: PropTypes.object.isRequired,
    };
    return withRPCRedux;
  };
}
