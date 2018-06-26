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
import {prepare, middleware} from 'fusion-react-async';

import {ApolloProvider} from 'react-apollo';

import {ProviderPlugin, ProvidedHOC, Provider} from 'fusion-react';

import type {Element} from 'react';
import type {Context, Token} from 'fusion-core';

import serverRender from './server';
import clientRender from './client';

export type ApolloClient = (Context, *) => *;

export const ApolloClientToken: Token<ApolloClient> = createToken(
  'ApolloClientToken'
);

export const GraphQLSchemaToken: Token<string> = createToken(
  'GraphQlSchemaToken'
);

export default class App extends CoreApp {
  constructor(root: Element<*>) {
    const renderer = createPlugin({
      deps: {
        getApolloClient: ApolloClientToken,
      },
      provides() {
        return el => {
          return prepare(el).then(() => {
            return __NODE__ ? serverRender(el) : clientRender(el);
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
            <ApolloProvider client={client}>{ctx.element}</ApolloProvider>
          );

          if (__NODE__) {
            return middleware(ctx, next).then(() => {
              const initialState = client.cache.extract();
              const serialized = JSON.stringify(initialState);
              const script = html`<script type="application/json" id="__APOLLO_STATE__">${serialized}</script>`;
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
