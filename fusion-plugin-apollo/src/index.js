/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import React from 'react';

import CoreApp, {createPlugin, createToken, html, unescape} from 'fusion-core';
import {prepare, middleware} from 'fusion-react-async';

import {ApolloProvider} from 'react-apollo';

import {ProviderPlugin, ProvidedHOC, Provider} from 'fusion-react';

import serverRender from './server';
import clientRender from './client';

export const ApolloClientToken = createToken('ApolloClientToken');

export default class App extends CoreApp {
  constructor(root) {
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
            initialState = JSON.parse(
              unescape(document.getElementById('__APOLLO_STATE__').textContent)
            );
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
