/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
/* eslint-env browser */
import {createPlugin, createToken} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';

export const RPCRoutePrefixConfigToken: Token<string> = createToken(
  'RPCRoutePrefixConfigToken'
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

type RPCServiceFactory = {from: () => RPC};
type RPCPluginType = FusionPlugin<*, RPCServiceFactory>;
const plugin: RPCPluginType =
  // $FlowFixMe
  __BROWSER__ &&
  createPlugin({
    deps: {
      fetch: FetchToken,
      routePrefix: RPCRoutePrefixConfigToken.optional,
    },
    provides: deps => {
      const {fetch = window.fetch, routePrefix} = deps;

      const prefix =
        routePrefix != null
          ? routePrefix // this hook is mostly for testing
          : window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server

      return {from: () => new RPC(fetch, prefix)};
    },
  });

export default plugin;
