/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {DocumentNode} from 'graphql';
import * as fusion_core from 'fusion-core';
import {Context, Token, Render, RouteTagsToken} from 'fusion-core';
import {LoggerToken, FetchToken} from 'fusion-tokens';
import React from 'react';
import * as apollo_client from 'apollo-client';
import {ApolloClient, ApolloClientOptions} from 'apollo-client';
import {GraphQLOptions} from 'apollo-server-koa';
import {ApolloCache} from 'apollo-cache';
import {ApolloLink} from 'apollo-link';

declare type GraphQLOptionsType = GraphQLOptions;
declare type InitApolloClientType<TInitialState> = (
  ctx: Context,
  initialState: TInitialState
) => ApolloClient<TInitialState>;
declare const GraphQLSchemaToken: Token<any>;
declare type ApolloContext<T> = (a: Context) => T | T;
declare const ApolloContextToken: Token<ApolloContext<unknown>>;
declare const ApolloCacheContext: React.Context<any>;
declare const GraphQLEndpointToken: Token<string>;
declare const ApolloClientToken: Token<InitApolloClientType<unknown>>;
declare const GetDataFromTreeToken: Token<any>;
declare type BodyParserConfigType = {
  enableTypes?: Array<string>;
  encoding?: string;
  formLimit?: string;
  jsonLimit?: string;
  textLimit?: string;
  strict?: boolean;
  detectJSON?: (ctx: Context) => boolean;
  extendTypes?: any;
  onerror?: (err: any, ctx: Context) => any;
  disableBodyParser?: (ctx: Context, next: () => Promise<any>) => Promise<any>;
};
declare const ApolloBodyParserConfigToken: Token<BodyParserConfigType>;
declare const ApolloDefaultOptionsConfigToken: Token<GraphQLOptionsType>;

declare type DepsType = {
  RouteTags: typeof RouteTagsToken;
  apolloContext: typeof ApolloContextToken.optional;
  logger: typeof LoggerToken.optional;
  schema: typeof GraphQLSchemaToken.optional;
  endpoint: typeof GraphQLEndpointToken.optional;
  getApolloClient: typeof ApolloClientToken;
  getDataFromTree: typeof GetDataFromTreeToken.optional;
  bodyParserConfig: typeof ApolloBodyParserConfigToken.optional;
  defaultOptionsConfig: typeof ApolloDefaultOptionsConfigToken.optional;
};
declare type ProvidesType = (el: any, ctx: Context) => Promise<any>;
declare const _default: (
  renderFn: Render
) => fusion_core.FusionPlugin<DepsType, ProvidesType>;

declare const GetApolloClientCacheToken: Token<
  (ctx: Context) => ApolloCache<unknown>
>;
declare const ApolloClientCredentialsToken: Token<string>;
declare const ApolloClientDefaultOptionsToken: Token<
  ApolloClientOptions<any>['defaultOptions']
>;
declare type ApolloLinkType = ApolloLink;
declare const GetApolloClientLinksToken: Token<
  (a: Array<ApolloLinkType>, ctx: Context) => Array<ApolloLinkType>
>;
declare const ApolloClientResolversToken: Token<ResolverMapType>;
declare const ApolloClientLocalSchemaToken: Token<
  string | string[] | DocumentNode | DocumentNode[]
>;
declare type ResolverMapType = apollo_client.Resolvers;
declare type ApolloClientDepsType = {
  getCache: typeof GetApolloClientCacheToken.optional;
  endpoint: typeof GraphQLEndpointToken.optional;
  fetch: typeof FetchToken.optional;
  includeCredentials: typeof ApolloClientCredentialsToken.optional;
  apolloContext: typeof ApolloContextToken.optional;
  getApolloLinks: typeof GetApolloClientLinksToken.optional;
  typeDefs: typeof ApolloClientLocalSchemaToken.optional;
  schema: typeof GraphQLSchemaToken.optional;
  resolvers: typeof ApolloClientResolversToken.optional;
  defaultOptions: typeof ApolloClientDefaultOptionsToken.optional;
};
declare const ApolloClientPlugin: fusion_core.FusionPlugin<
  ApolloClientDepsType,
  InitApolloClientType<unknown>
>;

declare function gql(path: string): DocumentNode;

export {
  ApolloBodyParserConfigToken,
  ApolloCacheContext,
  ApolloClientCredentialsToken,
  ApolloClientDefaultOptionsToken,
  ApolloClientLocalSchemaToken,
  ApolloClientPlugin,
  ApolloClientResolversToken,
  ApolloClientToken,
  ApolloContext,
  ApolloContextToken,
  ApolloDefaultOptionsConfigToken,
  _default as ApolloRenderEnhancer,
  GetApolloClientCacheToken,
  GetApolloClientLinksToken,
  GetDataFromTreeToken,
  GraphQLEndpointToken,
  GraphQLSchemaToken,
  InitApolloClientType,
  gql,
};
