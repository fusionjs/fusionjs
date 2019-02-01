// @flow

import browserPlugin from './browser';
import serverPlugin from './server';
import getHandlers from './handlers';
import {
  SWTemplateFunctionToken,
  SWLoggerToken,
  SWRegisterToken,
} from './tokens';

export default (__NODE__ ? serverPlugin : browserPlugin);
export {getHandlers, SWTemplateFunctionToken, SWLoggerToken, SWRegisterToken};
