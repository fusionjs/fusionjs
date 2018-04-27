/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import browserDataFetching from './browser';
import serverDataFetching from './server';

export {default as mock} from './mock';

declare var __BROWSER__: Boolean;
const RPC = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default RPC;
export {BodyParserOptionsToken, RPCToken, RPCHandlersToken} from './tokens';
