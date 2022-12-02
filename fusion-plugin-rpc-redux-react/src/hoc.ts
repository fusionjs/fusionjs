/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import type {Reducer} from 'redux';
import {useRPCRedux} from './hook';
import {createRPCReactors} from 'fusion-rpc-redux';

type RPCReducersType = {
  start?: Reducer<any, any>;
  success?: Reducer<any, any>;
  failure?: Reducer<any, any>;
};

export function withRPCReactor<Props extends {}>(
  rpcId: string,
  reducers: RPCReducersType,
  {
    propName,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args: any, ownProps: Props) => any;
  } = {}
) {
  return withRPCRedux(rpcId, {
    actions: createRPCReactors(rpcId, reducers),
    propName,
    // @ts-expect-error todo(flow->ts) can this be removed?
    rpcId,
    transformParams,
    mapStateToParams,
  });
}

export function withRPCRedux<Props extends {}>(
  rpcId: string,
  {
    propName,
    actions,
    transformParams,
    mapStateToParams,
  }: {
    propName?: string;
    actions?: any;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args: any, ownProps: Props) => any;
  } = {}
): (a: React.ComponentType<any>) => React.ComponentType<any> {
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
      return React.createElement(Component, {
        ...props,
        [propName || rpcId]: handler,
      });
    }
    const displayName = Component.displayName || Component.name || 'Anonymous';
    WithRPCRedux.displayName = 'WithRPCRedux' + '(' + displayName + ')';
    return WithRPCRedux;
  };
}
