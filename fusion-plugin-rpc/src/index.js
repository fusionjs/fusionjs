import browserDataFetching from './browser.js';
import serverDataFetching from './server.js';

const RPC = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default RPC;
