/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import {
  BodyParserOptionsToken,
  RPCToken,
  RPCHandlersToken,
} from 'fusion-plugin-rpc';
import {createRPCReducer} from 'fusion-rpc-redux';
import {withRPCRedux, withRPCReactor} from './hoc';
import plugin, {mock} from './plugin';

export default plugin;
export {
  BodyParserOptionsToken,
  createRPCReducer,
  mock,
  RPCToken,
  RPCHandlersToken,
  withRPCRedux,
  withRPCReactor,
};
