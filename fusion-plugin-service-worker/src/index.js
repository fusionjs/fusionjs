// @flow

import browserPlugin from './browser';
import serverPlugin from './server';
import getHandlers from './handlers';

export default (__NODE__ ? serverPlugin : browserPlugin);
export {getHandlers};
