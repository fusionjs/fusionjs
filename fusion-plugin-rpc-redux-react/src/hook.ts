/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
// $FlowFixMe
import {ReactReduxContext} from 'react-redux';
import {RPCToken} from 'fusion-plugin-rpc';
import {ReduxToken} from 'fusion-plugin-react-redux';
import {FusionContext, useService} from 'fusion-react';
import {createRPCHandler} from 'fusion-rpc-redux';

export function useRPCRedux(
  rpcId: string,
  {
    actions,
    transformParams,
    mapStateToParams,
  }: {
    actions?: any;
    transformParams?: (params: any) => any;
    mapStateToParams?: (state: any, args?: any) => any;
  } = {}
): (a: any) => Promise<any> {
  const reactReduxContext = React.useContext(ReactReduxContext);
  const ctx = React.useContext(FusionContext);
  const reduxPlugin = useService(ReduxToken).from(ctx);
  const rpc = useService(RPCToken).from(ctx);
  const store = reactReduxContext ? reactReduxContext.store : reduxPlugin.store;
  const handler = React.useMemo(
    () =>
      createRPCHandler({
        rpcId,
        rpc,
        store,
        actions,
        mapStateToParams,
        transformParams,
      }),
    [rpcId, rpc, store, actions, mapStateToParams, transformParams]
  );
  return handler;
}
