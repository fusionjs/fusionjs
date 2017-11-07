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
          rpc,
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
