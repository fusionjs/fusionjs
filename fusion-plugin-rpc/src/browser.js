/* eslint-env browser */

import {Plugin} from 'fusion-core';

export default ({fetch = window.fetch, handlers, routePrefix} = {}) => {
  if (__DEV__ && handlers) {
    if (Object.keys(handlers).find(h => typeof handlers[h] === 'function')) {
      const error = `Don't bundle server-side {handlers} in the client. Instead of 'const handlers = {...}', use 'const handlers = __NODE__ && {...}'`;
      throw new Error(error);
    }
  }

  const prefix =
    routePrefix != null
      ? routePrefix // this hook is mostly for testing
      : window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server

  return new Plugin({
    Service: class RPC {
      request(rpcId, args) {
        // TODO(#3) handle args instanceof FormData
        return fetch(`${prefix}/api/${rpcId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args || {}),
        })
          .then(r => r.json())
          .then(({status, data}) => {
            if (status === 'success') {
              return data;
            } else {
              return Promise.reject(data);
            }
          });
      }
    },
  });
};
