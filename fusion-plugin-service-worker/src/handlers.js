// @flow

/* eslint-env serviceworker */
/* globals location, URL, fetch,  */

import type {AssetInfo} from './types';

const cacheName = '0.0.0'; // we don't expect this to change

export default function getHandlers(assetInfo: AssetInfo) {
  const {precachePaths, cacheablePaths} = assetInfo;
  return {
    onInstall: (event: InstallEvent) => {
      self.skipWaiting();
      event.waitUntil(
        // remove old cache
        caches
          .open(cacheName)
          .then(cache => {
            return (
              cache
                // $FlowFixMe
                .addAll(precachePaths)
                .then(() =>
                  getOutdatedKeys(cache, cacheablePaths).then(outdatedKeys =>
                    removeKeys(cache, outdatedKeys)
                  )
                )
            );
          })
          .catch(e => {
            throw new Error(`sw: error updating cache ${cacheName}: ${e}`);
          })
      );
    },
    onFetch: (event: FetchEvent) => {
      const HTML_TTL = 1 * 24 * 60 * 60 * 1001; // 1 day
      const expectsHtml = requestExpectsHtml(event.request);
      if (
        !expectsHtml &&
        !cacheablePaths.includes(new URL(event.request.url).pathname)
      ) {
        // bypass service worker, use network
        return;
      }
      event.waitUntil(
        // $FlowFixMe
        event.respondWith(
          caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              if (expectsHtml) {
                const responseCreated = new Date(
                  cachedResponse.headers.get('date')
                ).valueOf();
                if (Date.now() - responseCreated > HTML_TTL) {
                  // html expired: use the cache, but refresh cache for next time
                  fetchNCache(event.request, expectsHtml);
                }
              }
              return cachedResponse;
            }
            return fetchNCache(event.request, expectsHtml);
          })
        )
      );
    },
  };
}

function getOutdatedKeys(cache, cacheablePaths) {
  return cache.keys().then(requests =>
    requests.filter(request => {
      return !cacheablePaths.find(key => {
        return location.origin + key === request.url;
      });
    })
  );
}

function removeKeys(cache, keys) {
  return Promise.all(keys.map(key => cache.delete(key)));
}

function fetchNCache(request, expectsHtml) {
  return fetch(request).then(resp => {
    if (resp.status !== 200) {
      return Promise.resolve(resp);
    }
    const clonedResponse = resp.clone();
    caches.open(cacheName).then(cache => {
      if (expectsHtml) {
        // check we got html before caching
        if (!responseIsHtml(clonedResponse)) {
          return Promise.resolve(resp);
        }
      }
      cache.put(request.url, clonedResponse);
    });
    return Promise.resolve(resp);
  });
}

function requestExpectsHtml(request) {
  if (!request || !request.headers) {
    return false;
  }
  const acceptHeader = request.headers.get('Accept');
  return acceptHeader && acceptHeader.indexOf('html') > -1;
}

function responseIsHtml(response) {
  if (!response || !response.headers) {
    return false;
  }
  const contentType = response.headers.get('content-type');
  return contentType && contentType.indexOf('html') > -1;
}

