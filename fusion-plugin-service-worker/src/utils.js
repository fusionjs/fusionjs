// @flow
import type {SWLoggerType} from './types';

/* global window, caches */
export function unregisterServiceWorker(logger: SWLoggerType) {
  return window.navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      const len = registrations.length;
      if (len) {
        logger.log(`*** unregistering ${len} sw${len > 1 ? 's' : ''}`);
        return Promise.all(
          registrations.map(
            registration =>
              new Promise(res => registration.unregister().then(() => res()))
          )
        );
      }
    })
    .then(() => deleteAllCaches())
    .catch(e => {
      deleteAllCaches().then(() => {
        logger.log('*** error unregistering sw:', e);
      });
    });
}

export function deleteAllCaches() {
  if (typeof caches === 'undefined') {
    return Promise.resolve(null);
  }
  return caches.keys().then(function onKeysFetch(keyList) {
    return Promise.all(
      keyList.map(function eachKey(key) {
        return caches.delete(key);
      })
    );
  });
}
