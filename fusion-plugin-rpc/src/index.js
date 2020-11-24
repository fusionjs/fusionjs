/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {RPCDepsType, RPCServiceType} from './types';

import browserDataFetching from './browser';
import serverDataFetching from './server';

export {default as mock} from './mock';
export {default as ResponseError} from './response-error';

export default __BROWSER__ ? browserDataFetching : serverDataFetching;

export {
  BodyParserOptionsToken,
  RPCToken,
  RPCHandlersToken,
  RPCHandlersConfigToken,
  RPCQueryParamsToken,
} from './tokens';

export {default as getMockRpcHandlers} from './mock-rpc-handlers';

export type {RPCDepsType};
export type RPCType = RPCServiceType;
