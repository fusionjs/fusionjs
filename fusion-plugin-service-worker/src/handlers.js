// @flow

/* eslint-env serviceworker */
/* globals location, URL, fetch,  */

import type {AssetInfo} from './types';

const cacheName = '0.0.0'; // we don't expect this to change
const debug = console;

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
            return cache
              .addAll(precachePaths)
              .then(() =>
                getOutdatedKeys(cache, cacheablePaths).then(outdatedKeys =>
                  removeKeys(cache, outdatedKeys)
                )
              );
          })
          .catch(e => {
            // Don't throw an error because we expect CORS (CDN) requests to not be precacheable
            // (`addAll` expects a 200 response, but CORS returns an opaque response)
            // CORS resources will be lazily cached on first fetch instead
            /* eslint-disable-next-line no-console */
            debug.log(`[sw debug] unable to pre-cache some resources: ${e}`);
          })
      );
    },
    onFetch: (event: FetchEvent) => {
      const expectsHtml = requestExpectsHtml(event.request);
      if (
        !expectsHtml &&
        !cacheablePaths.includes(event.request.url) &&
        !cacheablePaths.includes(new URL(event.request.url).pathname)
      ) {
        // bypass service worker, use network
        return;
      }
      const p = caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          fetchAndCache(event.request, expectsHtml); // async update cache for next time
          return cachedResponse; // return cache now
        }
        return fetchAndCache(event.request, expectsHtml); // fetch, then cache and return
      });
      event.respondWith(p);
      event.waitUntil(p);
    },
  };
}

function getOutdatedKeys(cache, cacheablePaths) {
  return cache.keys().then(requests =>
    requests.filter(request => {
      return !cacheablePaths.find(key => {
        return origin() + String(key) === request.url;
      });
    })
  );
}

function removeKeys(cache, keys) {
  return Promise.all(keys.map(key => cache.delete(key)));
}

function fetchAndCache(request, expectsHtml) {
  return fetch(request).then(resp => {
    if (expectsHtml) {
      // check we've got good html before caching
      if (!responseIsOKAndHtml(resp)) {
        debug.log(
          `[sw debug] expected HTML but got ${(resp &&
            resp.headers &&
            resp.headers.get('content-type')) ||
            'unknown'}`
        );
        // Might be redirect due to session expiry or error
        // Clear cache but still pass original response back to browser
        return caches.delete(cacheName).then(() => Promise.resolve(resp));
      }
    } else {
      // For non html resources allow 0 status code because that is an opaque response from behind CORS
      // We do an immediate network fetch after this, so if response was temporarily bad it won't stay bad
      if (resp.status !== 200 && resp.status !== 0) {
        return Promise.resolve(resp);
      }
    }

    const clonedResponse = resp.clone();
    caches.open(cacheName).then(cache => {
      cache.put(request.url, clonedResponse);
    });
    // Pass original response back to browser
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

function responseIsOKAndHtml(response) {
  if (!response || !response.headers || !response.status) {
    return false;
  }
  const contentType = response.headers.get('content-type');
  return (
    response.status === 200 && contentType && contentType.indexOf('html') > -1
  );
}

function origin() {
  const {origin, protocol, hostname, port} = location;
  return origin || `${protocol}'//'${hostname}${port ? ':' + port : ''}`;
}
