/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import type {Reducer} from 'redux';
import {useRPCRedux} from './hook.js';
import {createRPCReactors} from 'fusion-rpc-redux';

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
    function WithRPCRedux(props: Props) {
      const wrappedMapStateToParams =
        mapStateToParams &&
        ((state, args) => mapStateToParams(state, args, props));
      const handler = useRPCRedux(rpcId, {
        actions,
        transformParams,
        mapStateToParams: wrappedMapStateToParams,
      });
      return React.createElement(Component, {...props, [propName]: handler});
    }
    const displayName = Component.displayName || Component.name || 'Anonymous';
    WithRPCRedux.displayName = 'WithRPCRedux' + '(' + displayName + ')';
    return WithRPCRedux;
  };
}
