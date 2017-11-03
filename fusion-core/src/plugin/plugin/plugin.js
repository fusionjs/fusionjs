import client from './plugin-client';
import server from './plugin-server';
export default (__BROWSER__ ? client : server);
