/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import plugin, {mock} from './plugin';

export {createRPCReducer} from 'fusion-rpc-redux';
export {withRPCRedux, withRPCReactor} from './hoc';

export default plugin;
export {mock};
export {
  RPCToken,
  RPCHandlersToken,
  RPCRoutePrefixConfigToken,
} from 'fusion-plugin-rpc';
