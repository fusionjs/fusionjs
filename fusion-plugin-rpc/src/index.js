/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createToken} from 'fusion-tokens';
import browserDataFetching from './browser';
import serverDataFetching from './server';

export {default as mock} from './mock';

const RPC = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default RPC;
export const RPCToken = createToken('RPCToken');
export {RPCHandlersToken} from './tokens';
export {RPCRoutePrefixConfigToken} from './browser';
