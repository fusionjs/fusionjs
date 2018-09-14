/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import {createPlugin, type Context} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';

import type {HandlerType} from './tokens.js';
import type {RPCPluginType, IEmitter} from './types.js';

class RPC {
  ctx: ?Context;
  emitter: ?IEmitter;
  handlers: ?HandlerType;
  fetch: ?Fetch;

  constructor(fetch: Fetch) {
    this.fetch = fetch;
  }

  request<TArgs, TResult>(
    rpcId: string,
    args: TArgs,
    headers: ?{[string]: string}
  ): Promise<TResult> {
    if (!this.fetch) {
      throw new Error('fusion-plugin-rpc requires `fetch`');
    }
    const fetch = this.fetch;

    // TODO(#3) handle args instanceof FormData
    return fetch(`/api/${rpcId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
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

const pluginFactory: () => RPCPluginType = () =>
  createPlugin({
    deps: {
      fetch: FetchToken,
    },
    provides: deps => {
      const {fetch = window.fetch} = deps;

      return {from: () => new RPC(fetch)};
    },
  });

export default ((__BROWSER__ && pluginFactory(): any): RPCPluginType);
