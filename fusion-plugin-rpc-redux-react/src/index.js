/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  BodyParserOptionsToken,
  RPCToken,
  RPCHandlersToken,
  ResponseError,
} from 'fusion-plugin-rpc';
import {createRPCReducer} from 'fusion-rpc-redux';
import type {ActionType} from 'fusion-rpc-redux';
import {withRPCRedux, withRPCReactor} from './hoc';
import {useRPCHandler} from './hook';
import plugin, {mock} from './plugin';

export default plugin;
export {
  BodyParserOptionsToken,
  ResponseError,
  createRPCReducer,
  mock,
  RPCToken,
  RPCHandlersToken,
  useRPCHandler,
  withRPCRedux,
  withRPCReactor,
};
export type {ActionType};
