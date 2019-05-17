/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ProviderPlugin} from 'fusion-react';
import rpc, {mock as RPCMock} from 'fusion-plugin-rpc';
import type {RPCType, RPCDepsType} from 'fusion-plugin-rpc';

export default ProviderPlugin.create<RPCDepsType, RPCType>(
  'rpc',
  rpc,
);
export const mock = ProviderPlugin.create<RPCDepsType, RPCType>(
  'rpc',
  RPCMock,
);
