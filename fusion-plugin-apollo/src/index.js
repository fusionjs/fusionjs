/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import React from 'react';

import CoreApp, {createPlugin, createToken, html, unescape} from 'fusion-core';
import type {ApolloClient} from 'apollo-client';

import {ApolloProvider} from 'react-apollo';

import {
  ProviderPlugin,
  ProvidedHOC,
  Provider,
  prepare,
  middleware,
} from 'fusion-react';

import type {Element} from 'react';
import type {Context, Token} from 'fusion-core';

import serverRender from './server';
import clientRender from './client';
import {LoggerToken} from 'fusion-tokens';

export type InitApolloClientType<TInitialState> = (
  ctx: Context,
  initialState: TInitialState
) => ApolloClient<TInitialState>;

export const ApolloClientToken: Token<
  InitApolloClientType<mixed>
> = createToken('ApolloClientToken');

export type ApolloContext<T> = (Context => T) | T;

export const ApolloContextToken: Token<ApolloContext<mixed>> = createToken(
  'ApolloContextToken'
);

export const GraphQLSchemaToken: Token<string> = createToken(
  'GraphQlSchemaToken'
);

export const ApolloCacheContext = React.createContext<
  $PropertyType<InitApolloClientType<mixed>, 'cache'>
>();

export default class App extends CoreApp {
  constructor(root: Element<*>, render: ?(Element<*>, ctx: Context) => any) {
    const renderer = createPlugin({
      deps: {
        getApolloClient: ApolloClientToken,
        logger: LoggerToken.optional,
      },
      provides({logger}) {
        return (el, ctx) => {
          return prepare(el).then(() => {
            return render
              ? render(el, ctx)
              : __NODE__
              ? serverRender(el, logger)
              : clientRender(el);
          });
        };
      },
      middleware({getApolloClient}) {
        // This is required to set apollo client/root on context before creating the client.
        return (ctx, next) => {
          if (!ctx.element) {
            return next();
          }

          // Deserialize initial state for the browser
          let initialState = null;
          if (__BROWSER__) {
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
            return middleware(ctx, next).then(() => {
              const initialState = client.cache && client.cache.extract();
              const serialized = JSON.stringify(initialState);
              const script = html`
                <script type="application/json" id="__APOLLO_STATE__">
                  ${serialized}
                </script>
              `;
              ctx.template.body.push(script);
            });
          } else {
            return middleware(ctx, next);
          }
        };
      },
    });
    super(root, renderer);
  }
}

export {ProviderPlugin, ProvidedHOC, Provider};

export function gql(path: string): string {
  throw new Error('fusion-apollo/gql should be replaced at build time');
}
