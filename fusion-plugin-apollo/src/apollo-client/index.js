/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin, createToken} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {
  GraphQLSchemaToken,
  ApolloContextToken,
  GraphQLEndpointToken,
} from '../tokens';
import {ApolloClient} from 'apollo-client';
import {HttpLink} from 'apollo-link-http';
import {from as apolloLinkFrom} from 'apollo-link';
import {SchemaLink} from 'apollo-link-schema';
import type {ApolloCache, ApolloClientOptions} from 'apollo-client';

import type {Context, FusionPlugin, Token} from 'fusion-core';
import {InMemoryCache} from 'apollo-cache-inmemory';

export const GetApolloClientCacheToken: Token<
  (ctx: Context) => ApolloCache<mixed>
> = createToken('GetApolloClientCacheToken');

export const ApolloClientCredentialsToken: Token<string> = createToken(
  'ApolloClientCredentialsToken'
);

export const ApolloClientDefaultOptionsToken: Token<
  $PropertyType<ApolloClientOptions<any>, 'defaultOptions'>
> = createToken('ApolloClientDefaultOptionsToken');

type ApolloLinkType = {request: (operation: any, forward: any) => any};

export const GetApolloClientLinksToken: Token<
  (Array<ApolloLinkType>, ctx: Context) => Array<ApolloLinkType>
> = createToken('GetApolloClientLinksToken');

export const ApolloClientResolversToken: Token<
  ResolverMapType | $ReadOnlyArray<ResolverMapType>
> = createToken('ApolloClientResolversToken');

type ResolverMapType = {
  +[key: string]: {
    +[field: string]: (
      rootValue?: any,
      args?: any,
      context?: any,
      info?: any
    ) => any,
  },
};

type ApolloClientDepsType = {
  getCache: typeof GetApolloClientCacheToken.optional,
  endpoint: typeof GraphQLEndpointToken.optional,
  fetch: typeof FetchToken,
  includeCredentials: typeof ApolloClientCredentialsToken.optional,
  apolloContext: typeof ApolloContextToken.optional,
  getApolloLinks: typeof GetApolloClientLinksToken.optional,
  schema: typeof GraphQLSchemaToken.optional,
  resolvers: typeof ApolloClientResolversToken.optional,
  defaultOptions: typeof ApolloClientDefaultOptionsToken.optional,
};

type InitApolloClientType = (
  ctx: Context,
  initialState: mixed
) => ApolloClient<mixed>;

function Container() {}

const ApolloClientPlugin: FusionPlugin<
  ApolloClientDepsType,
  InitApolloClientType
> = createPlugin({
  deps: {
    getCache: GetApolloClientCacheToken.optional,
    endpoint: GraphQLEndpointToken.optional,
    fetch: FetchToken,
    includeCredentials: ApolloClientCredentialsToken.optional,
    apolloContext: ApolloContextToken.optional,
    getApolloLinks: GetApolloClientLinksToken.optional,
    schema: GraphQLSchemaToken.optional,
    resolvers: ApolloClientResolversToken.optional,
    defaultOptions: ApolloClientDefaultOptionsToken.optional,
  },
  provides({
    getCache = ctx => new InMemoryCache(),
    endpoint = '/graphql',
    fetch,
    includeCredentials = 'same-origin',
    apolloContext = ctx => ctx,
    getApolloLinks,
    schema,
    resolvers,
    defaultOptions,
  }) {
    function getClient(ctx, initialState) {
      const cache = getCache(ctx);
      const connectionLink =
        schema && __NODE__
          ? new SchemaLink({
              schema,
              context:
                typeof apolloContext === 'function'
                  ? apolloContext(ctx)
                  : apolloContext,
            })
          : new HttpLink({
              uri: endpoint,
              credentials: includeCredentials,
              fetch,
            });

      const links: Array<ApolloLinkType> = getApolloLinks
        ? getApolloLinks([connectionLink], ctx)
        : [connectionLink];

      const client = new ApolloClient({
        ssrMode: __NODE__,
        connectToDevTools: __BROWSER__ && __DEV__,
        link: apolloLinkFrom(links),
        cache: cache.restore(initialState),
        resolvers,
        defaultOptions,
      });
      return client;
    }
    return (ctx: Context, initialState: mixed) => {
      if (ctx.memoized.has(Container)) {
        return ctx.memoized.get(Container);
      }
      const client = getClient(ctx, initialState);
      ctx.memoized.set(Container, client);
      return client;
    };
  },
});
export {ApolloClientPlugin};
