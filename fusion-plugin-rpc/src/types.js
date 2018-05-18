/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FusionPlugin, Context} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import type {Fetch} from 'fusion-tokens';

import type {HandlerType} from './tokens.js';

type ExtractReturnType = <V>(() => V) => V;

export type RPCScopedServiceType = {
  ctx: ?Context,
  emitter: ?$Call<ExtractReturnType, typeof UniversalEventsToken>,
  handlers: ?HandlerType,
  fetch: ?Fetch,

  request(method: string, args: mixed): Promise<*>,
};

export type RPCServiceType = {
  from: (ctx?: Context) => RPCScopedServiceType,
};

export type RPCPluginType = FusionPlugin<*, RPCServiceType>;

export type IEmitter = $Call<ExtractReturnType, typeof UniversalEventsToken>;
