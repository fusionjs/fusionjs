/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {FusionContext, useService} from 'fusion-react';
import {RPCToken} from 'fusion-plugin-rpc';
import {ReduxToken} from 'fusion-plugin-react-redux';
import {createRPCHandler} from 'fusion-rpc-redux';

type OptionalHandlerArgs = {
  actions?: any,
  transformParams?: (params: any) => any,
  mapStateToParams?: (state: any, args?: any, ownProps: {}) => any,
};

export function useRPCHandler(rpcId: string, opts: OptionalHandlerArgs) {
  const ctx = React.useContext(FusionContext);
  const {store} = useService(ReduxToken).from(ctx);
  const rpc = useService(RPCToken).from(ctx);
  const handler = createRPCHandler({
    ...opts,
    rpcId,
    rpc,
    store,
  });
  return handler;
}
