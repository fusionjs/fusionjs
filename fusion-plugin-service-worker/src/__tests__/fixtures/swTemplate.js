// @flow
/* globals,  */

import type {AssetInfo} from '../../types';

export default (params: AssetInfo) => {
  return `
    import {getHandlers} from '../../index';
    var sw = (assetInfo: mixed) => {
    const {onFetch, onInstall} = getHandlers(assetInfo);
    self.addEventListener('install', onInstall);
    self.addEventListener('fetch', onFetch);
    return sw(${JSON.stringify(params)})`;
};
