/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import type {Reducer} from 'redux';
import {createRPCHandler, createRPCReactors} from 'fusion-rpc-redux';
import {FusionContext, useService} from 'fusion-react';
import {RPCToken} from 'fusion-plugin-rpc';
import {connect} from 'react-redux';

type RPCReducersType = {
  start?: Reducer<*, *>,
  success?: Reducer<*, *>,
  failure?: Reducer<*, *>,
};
export function withRPCReactor<Props: {}>(
  rpcId: string,
  reducers: RPCReducersType,
  {
    propName,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string,
    transformParams?: (params: any) => any,
    mapStateToParams?: (state: any, args?: any, ownProps: Props) => any,
  } = {}
) {
  return withRPCRedux(rpcId, {
    actions: createRPCReactors(rpcId, reducers),
    propName,
    rpcId,
    transformParams,
    mapStateToParams,
  });
}

export function withRPCRedux<Props: {}>(
  rpcId: string,
  {
    propName = rpcId,
    actions,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string,
    actions?: any,
    transformParams?: (params: any) => any,
    mapStateToParams?: (state: any, args?: any, ownProps: Props) => any,
  } = {}
): (React.ComponentType<*>) => React.ComponentType<*> {
  return (Component: React.ComponentType<Props>) => {
    function WithRPCRedux(oldProps: Props) {
      const {dispatch, state, ...restProps} = oldProps;
      console.log({dispatch, state});
      const service = useService(RPCToken);
      const ctx = React.useContext(FusionContext);
      const rpc = service.from(ctx);
      if (mapStateToParams) {
        const mapState = mapStateToParams;
        mapStateToParams = (state, args) => mapState(state, args, restProps);
      }
      const handler = createRPCHandler({
        rpcId,
        rpc,
        store: { dispatch, getState() { return state; } },
        actions,
        mapStateToParams,
        transformParams,
      });
      const props = {
        ...restProps,
        [propName]: handler,
      };
      return React.createElement(Component, props);
    }
    const connected = connect(
      state => ({state}),
      dispatch => ({dispatch}),
    )(WithRPCRedux);
    const displayName = Component.displayName || Component.name || 'Anonymous';
    connected.displayName = 'WithRPCRedux' + '(' + displayName + ')';
    return connected;
  };
}

// This depends fusion-plugin-rpc, but doesnt specify it
// Rewrite plugin?
