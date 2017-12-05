// @flow

import client from './plugin-client';
import server from './plugin-server';

declare var __BROWSER__: boolean;
export default (__BROWSER__ ? client : server);
