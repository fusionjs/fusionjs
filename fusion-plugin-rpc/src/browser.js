/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
/* eslint-env browser */

import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {FetchToken, createOptionalToken} from 'fusion-tokens';

import {RPCHandlersToken} from './tokens';

declare var __DEV__: boolean;

export const RPCRoutePrefixConfigToken: ?string = createOptionalToken(
  'RPCRoutePrefixConfigToken',
  null
);

// TODO(#54) Web Platform | 2018-01-19 - Import Flow declaration for 'fetch' from libdef
type Fetch = (
  input: string | Request,
  init?: RequestOptions
) => Promise<Response>;

class RPC {
  fetch: *;
  prefix: string;

  constructor(fetch: Fetch, prefix: string) {
    this.fetch = fetch;
    this.prefix = prefix;
  }

  request(rpcId: string, args: *): Promise<*> {
    // TODO(#3) handle args instanceof FormData
    return this.fetch(`${this.prefix}/api/${rpcId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args || {}),
    })
      .then(r => r.json())
      .then(args => {
        const {status, data} = args;
        if (status === 'success') {
          return data;
        } else {
          return Promise.reject(data);
        }
      });
  }
}

type RPCServiceFactory = () => RPC;
type RPCPluginType = FusionPlugin<*, RPCServiceFactory>;
const plugin: RPCPluginType = createPlugin({
  deps: {
    fetch: FetchToken,
    handlers: RPCHandlersToken,
    routePrefix: RPCRoutePrefixConfigToken,
  },
  provides: deps => {
    const {fetch = window.fetch, handlers, routePrefix} = deps;

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

    return () => new RPC(fetch, prefix);
  },
});

export default plugin;
