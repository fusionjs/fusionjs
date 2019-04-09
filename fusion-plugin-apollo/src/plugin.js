/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import React from 'react';

import {createPlugin, html} from 'fusion-core';

import {ApolloProvider} from 'react-apollo';

import type {Context, Render} from 'fusion-core';

import serverRender from './server';
import {LoggerToken} from 'fusion-tokens';
import {ApolloServer} from 'apollo-server-koa';
import compose from 'koa-compose';
import {
  ApolloContextToken,
  ApolloCacheContext,
  GraphQLSchemaToken,
  GraphQLEndpointToken,
  ApolloClientToken,
} from './tokens';

export type DepsType = {
  apolloContext: typeof ApolloContextToken.optional,
  logger: typeof LoggerToken.optional,
  schema: typeof GraphQLSchemaToken.optional,
  endpoint: typeof GraphQLEndpointToken.optional,
  getApolloClient: typeof ApolloClientToken,
};

export type ProvidesType = (el: any, ctx: Context) => Promise<any>;

function getDeps(): DepsType {
  if (__NODE__) {
    return {
      apolloContext: ApolloContextToken.optional,
      logger: LoggerToken.optional,
      schema: GraphQLSchemaToken.optional,
      endpoint: GraphQLEndpointToken.optional,
      getApolloClient: ApolloClientToken,
    };
  }
  // $FlowFixMe
  return {
    getApolloClient: ApolloClientToken,
  };
}

export default (renderFn: Render) =>
  createPlugin<DepsType, ProvidesType>({
    deps: getDeps(),
    provides(deps) {
      if (__BROWSER__) {
        return renderFn;
      }
      return (el, ctx) => {
        return serverRender(el, deps.logger).then(() => {
          return renderFn(el, ctx);
        });
      };
    },
    middleware({
      schema,
      endpoint = '/graphql',
      getApolloClient,
      apolloContext = ctx => {
        return ctx;
      },
    }) {
      const renderMiddleware = (ctx, next) => {
        if (!ctx.element) {
          return next();
        }
        let initialState = null;
        if (__BROWSER__) {
          // Deserialize initial state for the browser
          const apolloState = document.getElementById('__APOLLO_STATE__');
          if (apolloState) {
            initialState = JSON.parse(unescape(apolloState.textContent));
          }
        }
        // Create the client and apollo provider
        const client = getApolloClient(ctx, initialState);
        ctx.element = (
          <ApolloCacheContext.Provider value={client.cache}>
            <ApolloProvider client={client}>{ctx.element}</ApolloProvider>
          </ApolloCacheContext.Provider>
        );

        if (__NODE__) {
          // Serialize state into html on server side render
          const initialState = client.cache && client.cache.extract();
          const serialized = JSON.stringify(initialState);
          const script = html`
            <script type="application/json" id="__APOLLO_STATE__">
              ${serialized}
            </script>
          `;
          ctx.template.body.push(script);
        }

        return next();
      };
      if (__NODE__ && schema) {
        const server = new ApolloServer({
          schema,
          // investigate other options
          context: ({ctx}) => {
            if (typeof apolloContext === 'function') {
              return apolloContext(ctx);
            }
            return apolloContext;
          },
        });
        let serverMiddleware = [];
        server.applyMiddleware({
          // switch to server.getMiddleware once https://github.com/apollographql/apollo-server/pull/2435 lands
          app: {
            use: m => {
              serverMiddleware.push(m);
            },
          },
          // investigate other options
          path: endpoint,
        });
        return compose([...serverMiddleware, renderMiddleware]);
      } else {
        return renderMiddleware;
      }
    },
  });
