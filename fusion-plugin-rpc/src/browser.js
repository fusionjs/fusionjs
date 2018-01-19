/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

import {FetchToken, createToken} from 'fusion-tokens';
import {withDependencies} from 'fusion-core';
import {RPCHandlersToken} from './tokens';

export const RPCRoutePrefixConfigToken = createToken(
  'RPCRoutePrefixConfigToken'
);

export default withDependencies({
  fetch: FetchToken,
  handlers: RPCHandlersToken,
  routePrefix: RPCRoutePrefixConfigToken,
})(({fetch = window.fetch, handlers, routePrefix} = {}) => {
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

  class RPC {
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
  }
  return () => new RPC();
});
