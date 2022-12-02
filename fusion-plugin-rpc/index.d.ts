/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Token, Context, RouteTagsToken, FusionPlugin} from 'fusion-core';
import {
  UniversalEventsToken,
  UniversalEventsType,
} from 'fusion-plugin-universal-events';
import {FetchToken, Fetch} from 'fusion-tokens';
import {I18nToken} from 'fusion-plugin-i18n';
import {Options} from 'koa-bodyparser';

declare const RPCToken: Token<RPCServiceType>;
declare type HandlerType = {
  [x: string]: (...args: any) => any;
};
declare const RPCHandlersToken: Token<HandlerType>;
declare const BodyParserOptionsToken: Token<Options>;
declare const RPCHandlersConfigToken: Token<RPCConfigType>;
declare const RPCQueryParamsToken: Token<{
  from: (ctx: Context) => Array<[string, string]>;
}>;

declare type RPCDepsType = {
  RouteTags?: typeof RouteTagsToken.optional;
  emitter: typeof UniversalEventsToken;
  handlers?: typeof RPCHandlersToken;
  bodyParserOptions?: typeof BodyParserOptionsToken.optional;
  fetch?: typeof FetchToken;
  i18n?: typeof I18nToken.optional;
  rpcConfig?: typeof RPCHandlersConfigToken.optional;
  queryParams?: typeof RPCQueryParamsToken.optional;
};
declare type RPCScopedServiceType = {
  ctx: Context | undefined | null;
  emitter?: UniversalEventsType;
  handlers: HandlerType | undefined | null;
  fetch: Fetch | undefined | null;
  request<TArgs, TResult>(method: string, args: TArgs): Promise<TResult>;
};
declare type RPCServiceType = {
  from: (ctx: Context) => RPCScopedServiceType;
};
declare type RPCPluginType = FusionPlugin<RPCDepsType, RPCServiceType>;

declare type RPCConfigType = {
  apiPath?: string;
};

declare const plugin: RPCPluginType;

declare class ResponseError extends Error {
  code: string | undefined | null;
  meta: any;
  cause: unknown | undefined | null;
  severity:
    | typeof ResponseError.Severity[keyof typeof ResponseError.Severity]
    | undefined
    | null;
  static Severity: Readonly<{
    HIGH: 'HIGH';
    MEDIUM: 'MEDIUM';
  }>;
  constructor(
    message: string,
    options?: {
      code?: string;
      meta?: any;
      cause?: unknown;
      severity?: typeof ResponseError.Severity[keyof typeof ResponseError.Severity];
    } | null
  );
}

declare type RpcResponse = any | ResponseError;
declare type RpcResponseMap = Array<{
  args: Array<any>;
  response: RpcResponse;
}>;
declare type RpcFixtureT = {
  [x: string]: RpcResponseMap | RpcResponse;
};
declare type OnMockRpcCallbackT = (
  handler: string,
  args: Array<any>,
  response: RpcResponse
) => void;
declare const getMockRpcHandlers: (
  fixtures: Array<RpcFixtureT>,
  onMockRpc?: OnMockRpcCallbackT
) => HandlerType;

declare const _default: RPCPluginType;

export {
  BodyParserOptionsToken,
  RPCDepsType,
  RPCHandlersConfigToken,
  RPCHandlersToken,
  RPCQueryParamsToken,
  RPCToken,
  RPCServiceType as RPCType,
  ResponseError,
  _default as default,
  getMockRpcHandlers,
  plugin as mock,
};
