/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
/* eslint-env browser */
import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';

// TODO(#54) Web Platform | 2018-01-19 - Import Flow declaration for 'fetch' from libdef
type Fetch = (
  input: string | Request,
  init?: RequestOptions
) => Promise<Response>;

class RPC {
  fetch: *;

  constructor(fetch: Fetch) {
    this.fetch = fetch;
  }

  request(rpcId: string, args: *): Promise<*> {
    // TODO(#3) handle args instanceof FormData
    return this.fetch(`/api/${rpcId}`, {
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
    },
    provides: deps => {
      const {fetch = window.fetch} = deps;

      return {from: () => new RPC(fetch)};
    },
  });

export default plugin;
