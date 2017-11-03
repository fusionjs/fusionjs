import PropTypes from 'prop-types';
import React from 'react';
import {createRPCHandler, createRPCReactor} from 'web-rpc-redux';

export const withRPCReactor = ({
  propName,
  rpcId,
  reactors,
  transformParams,
  mapStateToParams,
}) => {
  const actions = createRPCReactor(rpcId, reactors);
  return withRPCRedux({
    actions,
    propName,
    rpcId,
    transformParams,
    mapStateToParams,
  });
};

export function withRPCRedux({
  propName,
  rpcId,
  actions,
  transformParams,
  mapStateToParams,
}) {
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
