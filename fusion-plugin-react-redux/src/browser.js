/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* globals __REDUX_DEVTOOLS_EXTENSION__ */

import React from 'react';
import {Provider} from 'react-redux';
import {compose, createStore} from 'redux';

import {createPlugin, unescape} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';

import ctxEnhancer from './ctx-enhancer';
import {ReducerToken, PreloadedStateToken, EnhancerToken} from './tokens.js';
import type {
  StoreWithContextType,
  ReactReduxDepsType,
  ReactReduxServiceType,
} from './types.js';

const getPlugin = () => {
  let storeCache = null;
  return createPlugin({
    deps: {
      reducer: ReducerToken,
      preloadedState: PreloadedStateToken.optional,
      enhancer: EnhancerToken.optional,
    },
    provides({reducer, preloadedState, enhancer}) {
      class Redux {
        store: StoreWithContextType<*, *, *>;

        constructor(ctx) {
          if (storeCache) {
            // $FlowFixMe
            this.store = storeCache;
          } else {
            // We only use initialState for client-side hydration
            // The real initial state should be derived from the reducer and the @@INIT action
            if (!preloadedState) {
              const stateElement = document.getElementById('__REDUX_STATE__');
              if (stateElement) {
                preloadedState = JSON.parse(unescape(stateElement.textContent));
              }
            }
            const devTool =
              __DEV__ &&
              window.__REDUX_DEVTOOLS_EXTENSION__ &&
              // $FlowFixMe
              __REDUX_DEVTOOLS_EXTENSION__();
            const enhancers = [enhancer, ctxEnhancer(ctx), devTool].filter(
              Boolean
            );
            // $FlowFixMe
            this.store = createStore(
              reducer,
              preloadedState,
              // $FlowFixMe
              compose(...enhancers)
            );
            storeCache = this.store;
          }
        }
      }
      return {
        from: (ctx?: Context) => {
          return new Redux(ctx);
        },
      };
    },
    middleware(_, redux) {
      return (ctx, next) => {
        const {store} = redux.from(ctx);
        ctx.element = <Provider store={store}>{ctx.element}</Provider>;
        return next();
      };
    },
  });
};

export default ((getPlugin: any): () => FusionPlugin<
  ReactReduxDepsType,
  ReactReduxServiceType
>);
