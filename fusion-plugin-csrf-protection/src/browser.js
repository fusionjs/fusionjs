/* eslint-env browser */

import {Plugin} from 'fusion-core';
import {verifyMethod, verifyExpiry} from './shared';

export default ({fetch = window.fetch, expire = 86400, routePrefix} = {}) => {
  const prefix = routePrefix != null
    ? routePrefix
    : window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server
  let token = '';

  function fetchWithCsrfToken(url, options = {}) {
    const isCsrfMethod = verifyMethod(options.method || 'GET');
    const isValid = verifyExpiry(token, expire);
    const isTokenRequired = !isValid || !token;
    if (isCsrfMethod && isTokenRequired) {
      // TODO(#3) don't append prefix if injected fetch also injects prefix
      return fetch(prefix + '/csrf-token', {
        method: 'POST',
        credentials: 'same-origin',
      }).then(r => {
        token = r.headers.get('x-csrf-token');
        return request();
      });
    } else {
      return request();
    }

    function request() {
      return fetch(prefix + url, {
        ...options,
        credentials: 'same-origin',
        headers: {
          ...(options.headers || {}),
          'x-csrf-token': token,
        },
      });
    }
  }

  return new Plugin({
    Service: class CsrfProtection {
      fetch(...args) {
        return fetchWithCsrfToken(...args);
      }
    },
  });
};
