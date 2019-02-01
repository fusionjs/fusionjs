// @flow
import type {SWLoggerType} from './types';

/* global window, caches */
export function unregisterServiceWorker(logger: SWLoggerType) {
  return window.navigator.serviceWorker
    .getRegistration()
    .then(registration => {
      return registration ? registration.unregister() : true;
    })
    .then(() => deleteAllCaches())
    .then(() => logger.log('*** sw unregistered'))
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
