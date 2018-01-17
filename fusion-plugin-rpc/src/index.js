import {createToken} from 'fusion-tokens';
import browserDataFetching from './browser';
import serverDataFetching from './server';

export {default as mock} from './mock';

const RPC = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default RPC;
export const RPCToken = createToken('RPCToken');
export {RPCHandlersToken} from './tokens';
export {RPCRoutePrefixConfigToken} from './browser';
