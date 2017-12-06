/* eslint-env browser */
import React from 'react';

import CoreApp, {html, unescape} from 'fusion-core';
import {prepare} from 'fusion-react-async';

import {ApolloProvider} from 'react-apollo';

import {ProviderPlugin, ProvidedHOC, Provider} from 'fusion-react';

import serverRender from './server';
import clientRender from './client';

export default class App extends CoreApp {
  constructor(root, getClient) {
    super(root, el => {
      return prepare(el).then(() => {
        return __NODE__ ? serverRender(el) : clientRender(el);
      });
    });

    // This is required to set apollo client/root on context before creating the client.
    const preRenderPlugin = (ctx, next) => {
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
      const client = getClient(ctx, initialState);
      ctx.element = (
        <ApolloProvider client={client}>{ctx.element}</ApolloProvider>
      );

      if (__NODE__) {
        return next().then(() => {
          const initialState = client.cache.extract();
          const serialized = JSON.stringify(initialState);
          const script = html`<script type="application/json" id="__APOLLO_STATE__">${serialized}</script>`;
          ctx.body.body.push(script);
        });
      } else {
        return next();
      }
    };

    this.plugin(() => preRenderPlugin);
  }
}

export {ProviderPlugin, ProvidedHOC, Provider};
