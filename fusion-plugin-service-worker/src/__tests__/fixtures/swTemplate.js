// @flow
/* globals,  */

import type {AssetInfo} from '../../types';

export default (params: AssetInfo) => {
  // simplified sw for testing
  return `var sw = (assetInfo: AssetInfo) => {
    return /* test SW */
    var cacheName = '0.0.0';
    var precachePaths = assetInfo.precachePaths;
    console.log('1');
    event => {
      self.skipWaiting();
      event.waitUntil(
        caches
          .open(cacheName)
          .then(cache => {
            return cache.addAll(precachePaths);
          })
          .catch(e => {
            throw new Error();
          })
      );
    };;
  };
  return sw(${JSON.stringify(params)})`;
};
