// @flow

import browserPlugin from './browser';
import serverPlugin from './server';
import getHandlers from './handlers';
import {
  SWTemplateFunctionToken,
  SWLoggerToken,
  SWRegisterToken,
  SWMaxCacheDurationMs,
} from './tokens';
import type {AssetInfo} from './types';

export default (__NODE__ ? serverPlugin : browserPlugin);
export {
  getHandlers,
  SWTemplateFunctionToken,
  SWLoggerToken,
  SWRegisterToken,
  SWMaxCacheDurationMs,
};
export type {AssetInfo};
