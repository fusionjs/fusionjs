/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import PropTypes from 'prop-types';
import * as React from 'react';
import type {Reducer} from 'redux';
import {createRPCHandler, createRPCReactors} from 'fusion-rpc-redux';

type RPCReducersType = {
  start?: Reducer<*, *>,
  success?: Reducer<*, *>,
  failure?: Reducer<*, *>,
};
export const withRPCReactor = (
  rpcId: string,
  reducers: RPCReducersType,
  {
    propName,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string,
    transformParams?: (params: any) => any,
    mapStateToParams?: (state: any) => any,
  } = {}
) => {
  return withRPCRedux(rpcId, {
    actions: createRPCReactors(rpcId, reducers),
    propName,
    rpcId,
    transformParams,
    mapStateToParams,
  });
};

export function withRPCRedux(
  rpcId: string,
  {
    propName,
    actions,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string,
    actions: any,
    transformParams?: (params: any) => any,
    mapStateToParams?: (state: any) => any,
  } = {}
): (React.ComponentType<*>) => React.ComponentType<*> {
  if (!propName) {
    propName = rpcId;
  }
  return (Component: React.ComponentType<*>) => {
    class withRPCRedux extends React.Component<*, *> {
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
    const displayName = Component.displayName || Component.name || 'Anonymous';
    withRPCRedux.displayName = 'WithRPCRedux' + '(' + displayName + ')';
    withRPCRedux.contextTypes = {
      rpc: PropTypes.object.isRequired,
      store: PropTypes.object.isRequired,
    };
    return withRPCRedux;
  };
}
