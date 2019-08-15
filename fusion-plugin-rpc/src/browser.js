/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import {createPlugin, type Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {I18nToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';

import {type HandlerType, RPCHandlersConfigToken} from './tokens.js';
import type {RPCPluginType, IEmitter, RPCConfigType} from './types.js';
import {formatApiPath} from './utils.js';

type InitializationOpts = {
  fetch: Fetch,
  emitter: IEmitter,
  localeCode: string,
  rpcConfig: ?RPCConfigType,
};

const statKey = 'rpc:method-client';

class RPC {
  ctx: ?Context;
  emitter: ?IEmitter;
  handlers: ?HandlerType;
  localeCode: ?string;
  fetch: ?Fetch;
  config: ?RPCConfigType;
  apiPath: string;
  constructor({fetch, emitter, rpcConfig, localeCode}: InitializationOpts) {
    this.fetch = fetch;
    this.config = rpcConfig || {};
    this.emitter = emitter;
    this.localeCode = localeCode;

    this.apiPath = formatApiPath(
      rpcConfig && rpcConfig.apiPath ? rpcConfig.apiPath : 'api'
    );
  }

  request<TArgs, TResult>(
    rpcId: string,
    args: TArgs,
    headers: ?{[string]: string}
  ): Promise<TResult> {
    if (!this.fetch) {
      throw new Error('fusion-plugin-rpc requires `fetch`');
    }
    if (!this.emitter) {
      throw new Error('Missing emitter registered to UniversalEventsToken');
    }
    const fetch = this.fetch;
    const emitter = this.emitter;
    const apiPath = this.apiPath;

    const startTime = Date.now();
    const localeParam = this.localeCode ? `?localeCode=${this.localeCode}` : '';

    // TODO(#3) handle args instanceof FormData
    return fetch(`${apiPath}${rpcId}${localeParam}`, {
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
          emitter.emit(statKey, {
            method: rpcId,
            status: 'success',
            timing: Date.now() - startTime,
          });
          return data;
        } else {
          emitter.emit(statKey, {
            method: rpcId,
            error: data,
            status: 'failure',
            timing: Date.now() - startTime,
          });
          return Promise.reject(data);
        }
      });
  }
}

const pluginFactory: () => RPCPluginType = () =>
  createPlugin({
    deps: {
      fetch: FetchToken,
      emitter: UniversalEventsToken,
      i18n: I18nToken.optional,
      rpcConfig: RPCHandlersConfigToken.optional,
    },
    provides: deps => {
      const {fetch = window.fetch, emitter, rpcConfig, i18n} = deps;

      return {
        from: ctx => {
          const locale = (i18n && i18n.from(ctx).locale) || '';
          const localeCode = typeof locale === 'string' ? locale : locale.code;
          return new RPC({
            fetch,
            emitter,
            rpcConfig,
            localeCode,
          });
        },
      };
    },
  });

export default ((__BROWSER__ && pluginFactory(): any): RPCPluginType);
