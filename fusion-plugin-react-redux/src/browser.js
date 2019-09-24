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
import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  ReducerNameSpaceToken,
} from './tokens.js';
import type {
  StoreWithContextType,
  ReactReduxDepsType,
  ReactReduxServiceType,
} from './types.js';
import {parseNamespace} from './utils';

const getPlugin = () => {
  const storeCache = {};
  return createPlugin({
    deps: {
      reducer: ReducerToken,
      preloadedState: PreloadedStateToken.optional,
      enhancer: EnhancerToken.optional,
      namespace: ReducerNameSpaceToken.optional,
    },
    provides({reducer, preloadedState, enhancer, namespace}) {
      class Redux {
        store: StoreWithContextType<*, *, *>;

        constructor(ctx) {
          const {suffix, cacheKey} = parseNamespace(namespace);
          if (storeCache[cacheKey]) {
            this.store = storeCache[cacheKey];
          } else {
            // We only use initialState for client-side hydration
            // The real initial state should be derived from the reducer and the @@INIT action
            if (!preloadedState) {
              const stateElement = document.getElementById(
                `__REDUX_STATE__${suffix}`
              );
              if (stateElement) {
                preloadedState = JSON.parse(unescape(stateElement.textContent));
              }
            }
            const devTool =
              __DEV__ &&
              window.__REDUX_DEVTOOLS_EXTENSION__ &&
              // $FlowFixMe
              __REDUX_DEVTOOLS_EXTENSION__({trace: true, traceLimit: 25});
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
            storeCache[cacheKey] = this.store;
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
    cleanup: async () => {
      Object.keys(storeCache).forEach(key => {
        delete storeCache[key];
      });
    },
  });
};

export default ((getPlugin: any): () => FusionPlugin<
  ReactReduxDepsType,
  ReactReduxServiceType
>);
