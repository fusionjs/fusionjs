// @flow

/* eslint-env serviceworker */
/* globals URL, fetch,  */

import type {AssetInfo} from './types';

const cacheName = '0.0.0'; // we don't expect this to change
const debug = console;
const defaultMaxCacheDuration = 24 * 60 * 60 * 1000; // one day

export default function getHandlers(assetInfo: AssetInfo) {
  const {
    precachePaths,
    cacheableResourcePaths,
    cacheableRoutePatternStrings,
    cacheBustingPatternStrings,
    cacheDuration = defaultMaxCacheDuration,
  } = assetInfo;
  const cacheableRoutePatterns = mapToRegex(cacheableRoutePatternStrings);
  const cacheBustingPatterns = mapToRegex(cacheBustingPatternStrings);
  return {
    onInstall: (event: InstallEvent) => {
      self.skipWaiting();
      event.waitUntil(
        // remove old caches, then precache
        caches.delete(cacheName).then(() =>
          caches
            .open(cacheName)
            .then(cache => {
              return cache.addAll(precachePaths);
            })
            .catch(e => {
              // Don't throw an error because we expect CORS (CDN) requests to not be precacheable
              // (`addAll` expects a 200 response, but CORS returns an opaque response)
              // CORS resources will be lazily cached on first fetch instead
              debug.log(`[sw debug] unable to pre-cache some resources: ${e}`);
            })
        )
      );
    },
    onActivate: (event: InstallEvent) => {
      // let all existing clients claim this new worker instance
      event.waitUntil(clients.claim());
      self.clients.matchAll().then(all =>
        all.map(client =>
          client.postMessage({
            type: 'upgrade-available',
            text: '*** from sw: reload for updates',
          })
        )
      );
    },
    onFetch: (event: FetchEvent) => {
      try {
        const expectsHtml = requestExpectsHtml(event.request);
        if (shouldInvalidateCache(event, cacheBustingPatterns)) {
          // clear cache then bypass service worker, use network
          return caches
            .delete(cacheName)
            .then(() =>
              debug.log(
                `[debug] navigation to ${event.request.url}, invalidated cache`
              )
            );
        }
        if (
          !requestIsCacheable(
            expectsHtml,
            cacheableResourcePaths,
            cacheableRoutePatterns,
            event
          )
        ) {
          // bypass service worker, use network
          return;
        }
        const p = caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            if (expectsHtml) {
              if (cacheHasExpired(cachedResponse, cacheDuration)) {
                // if html cache has expired, clear all caches and refetch
                return caches
                  .delete(cacheName)
                  .then(() =>
                    self.clients.matchAll().then(all =>
                      all.map(client =>
                        client.postMessage({
                          type: 'cache-expired',
                          text: '*** from sw: cache expired',
                        })
                      )
                    )
                  )
                  .then(() => fetchAndCache(event.request, expectsHtml));
              }
            }
            fetchAndCache(event.request, expectsHtml); // async update cache for next time
            return cachedResponse; // return cache now
          }
          return fetchAndCache(event.request, expectsHtml); // fetch, then cache and return
        });
        event.respondWith(p);
        event.waitUntil(p);
      } catch (e) {
        caches
          .delete(cacheName)
          .then(() => debug.log(`*** sw fetch failed with`, e));
      }
    },
  };
}

function fetchAndCache(request, expectsHtml) {
  return fetch(request).then(resp => {
    if (expectsHtml) {
      // check we've got good html before caching
      if (!responseIsOKAndHtml(resp)) {
        debug.log(unexpectedResponseMessage(resp));
        // Might be redirect due to session expiry or error
        // Clear cache but still pass original response back to browser
        return caches.delete(cacheName).then(() => resp);
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

function requestIsCacheable(
  expectsHtml,
  cacheablePaths,
  cacheableRoutePatterns,
  event
) {
  const url = new URL(event.request.url);
  if (expectsHtml) {
    // cache html unless cacheableRoutePatterns is specified and non-matching
    return cacheableRoutePatterns
      ? cacheableRoutePatterns.some(p => (url.pathname + url.search).match(p))
      : true;
  } else {
    return cacheablePaths.includes(url.pathname);
  }
}

function cacheHasExpired(cachedResponse, cacheDuration) {
  const dateHeader = cachedResponse.headers.get('date');
  return dateHeader
    ? Date.now() - new Date(dateHeader).valueOf() > cacheDuration
    : false;
}

function shouldInvalidateCache(event, cacheBustingPatterns) {
  return (
    cacheBustingPatterns &&
    cacheBustingPatterns.some(pattern => event.request.url.match(pattern))
  );
}

function unexpectedResponseMessage(resp) {
  return `[sw debug] expected HTML but got ${(resp &&
    resp.headers &&
    resp.headers.get('content-type')) ||
    'unknown'}`;
}

function mapToRegex(arr) {
  return arr.length ? arr.map(str => new RegExp(str.replace(/\//g, ''))) : null;
}
