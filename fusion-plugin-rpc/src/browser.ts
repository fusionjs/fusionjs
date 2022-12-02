/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */

import {createPlugin, memoize, type Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {I18nToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';

import {
  type HandlerType,
  RPCHandlersConfigToken,
  RPCQueryParamsToken,
} from './tokens';
import type {RPCPluginType, IEmitter, RPCConfigType} from './types';
import {formatApiPath} from './utils';

type InitializationOpts = {
  fetch: Fetch;
  emitter: IEmitter;
  queryParams: Array<[string, string]>;
  rpcConfig: RPCConfigType | undefined | null;
};

const statKey = 'rpc:method-client';

class RPC {
  ctx: Context | undefined | null;
  emitter: IEmitter | undefined | null;
  handlers: HandlerType | undefined | null;
  queryParams: Array<[string, string]>;
  fetch: Fetch | undefined | null;
  config: RPCConfigType | undefined | null;
  apiPath: string;
  constructor({fetch, emitter, rpcConfig, queryParams}: InitializationOpts) {
    this.fetch = fetch;
    this.config = rpcConfig || {};
    this.emitter = emitter;
    this.queryParams = queryParams;

    this.apiPath = formatApiPath(
      rpcConfig && rpcConfig.apiPath ? rpcConfig.apiPath : 'api'
    );
  }

  request<TArgs, TResult>(
    rpcId: string,
    args: TArgs,
    headers?: {
      [x: string]: string;
    } | null,
    options?: RequestInit | null
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
    const queryParams =
      this.queryParams.length > 0
        ? `?${this.queryParams
            .map(
              ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
            )
            .join('&')}`
        : '';

    return fetch(
      `${apiPath}${rpcId}${queryParams}`,
      args instanceof FormData
        ? {
            ...options,
            method: 'POST',
            headers: {
              // Content-Type will be set automatically
              ...(headers || {}),
            },
            body: args,
          }
        : {
            ...options,
            method: 'POST',
            // $FlowFixMe
            headers: {
              'Content-Type': 'application/json',
              ...(headers || {}),
            },
            body: JSON.stringify(args || {}),
          }
    )
      .then((r) => r.json())
      .then((args) => {
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
          return Promise.reject(data ? data : {});
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
      queryParams: RPCQueryParamsToken.optional,
    },
    provides: (deps) => {
      const {
        fetch = window.fetch,
        emitter,
        rpcConfig,
        i18n,
        queryParams,
      } = deps;

      return {
        from: memoize((ctx) => {
          const queryParamsValue = (queryParams && queryParams.from(ctx)) || [];
          const locale = (i18n && i18n.from(ctx).locale) || '';
          const localeCode = typeof locale === 'string' ? locale : locale.code;
          if (localeCode) {
            queryParamsValue.push(['localeCode', localeCode]);
          }
          return new RPC({
            fetch,
            emitter,
            rpcConfig,
            queryParams: queryParamsValue,
          });
        }),
      };
    },
  });

export default __BROWSER__ && (pluginFactory() as any as RPCPluginType);
