import browserDataFetching from './browser.js';
import serverDataFetching from './server.js';
export {default as mock} from './mock';

const RPC = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default RPC;
