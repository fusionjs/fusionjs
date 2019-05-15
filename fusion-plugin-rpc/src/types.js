/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FusionPlugin, Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {type Fetch, FetchToken} from 'fusion-tokens';

import {
  RPCHandlersToken,
  BodyParserOptionsToken,
  type HandlerType,
} from './tokens.js';

type ExtractReturnType = <V>(() => V) => V;

export type RPCDepsType = {
  emitter: typeof UniversalEventsToken,
  handlers?: typeof RPCHandlersToken,
  bodyParserOptions?: typeof BodyParserOptionsToken.optional,
  fetch?: typeof FetchToken,
};

export type RPCScopedServiceType = {
  ctx: ?Context,
  emitter: ?$Call<ExtractReturnType, typeof UniversalEventsToken>,
  handlers: ?HandlerType,
  fetch: ?Fetch,

  request<TArgs, TResult>(method: string, args: TArgs): Promise<TResult>,
};

export type RPCServiceType = {
  from: (ctx: Context) => RPCScopedServiceType,
};

export type RPCPluginType = FusionPlugin<RPCDepsType, RPCServiceType>;

export type IEmitter = $Call<ExtractReturnType, typeof UniversalEventsToken>;
