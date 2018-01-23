/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import plugin from './plugin';
import {ProviderPlugin} from 'fusion-react';
export {createRPCReducer} from 'fusion-rpc-redux';
import {mock as RPCMock} from 'fusion-plugin-rpc';
export {withRPCRedux, withRPCReactor} from './hoc';

export default plugin;

export const mock = ProviderPlugin.create('rpc', RPCMock);

export {
  RPCToken,
  RPCHandlersToken,
  RPCRoutePrefixConfigToken,
} from 'fusion-plugin-rpc';
