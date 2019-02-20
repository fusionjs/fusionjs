// @flow

/* globals self */

import {getHandlers} from '../../../dist';
import type {AssetInfo} from '../../../src/types';

export default (assetInfo: AssetInfo) => {
  const {onFetch, onInstall} = getHandlers(assetInfo);
  self.addEventListener('install', onInstall);
  self.addEventListener('fetch', onFetch);
};
