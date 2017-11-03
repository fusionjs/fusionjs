/* eslint-env browser */

import {Plugin} from 'fusion-core';
import {unescape} from 'fusion-core';

export default (
  {fetch = window.fetch, handlers, routePrefix, hydrationState} = {}
) => {
  if (__DEV__ && handlers) {
    if (Object.keys(handlers).find(h => typeof handlers[h] === 'function')) {
      const error = `Don't bundle server-side {handlers} in the client. Instead of 'const handlers = {...}', use 'const handlers = __NODE__ && {...}'`;
      throw new Error(error);
    }
  }

  const prefix = routePrefix != null
    ? routePrefix // this hook is mostly for testing
    : window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server
  const serializedHandlerNames =
    hydrationState || // this hook is mostly for testing
    JSON.parse(
      unescape(document.getElementById('__DATA_FETCHING_METHODS__').textContent) // created by ./server
    );

  return new Plugin({
    Service: class RPC {
      constructor() {
        const methods = serializedHandlerNames;
        methods.forEach(key => {
          this[key] = args => {
            // TODO(#3) handle args instanceof FormData
            return fetch(`${prefix}/api/${key}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(args || {}),
            }).then(r => r.json());
          };
        });
      }
    },
  });
};
