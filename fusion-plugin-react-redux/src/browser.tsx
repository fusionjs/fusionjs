/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */

import React from 'react';
import {Provider} from 'react-redux';
import {compose, createStore} from 'redux';

import {createPlugin, unescape} from 'fusion-core';
import type {Context} from 'fusion-core';

import ctxEnhancer from './ctx-enhancer';
import {deserialize} from './codec';
import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  ReduxDevtoolsConfigToken,
} from './tokens';
import type {StoreWithContextType, ReactReduxServiceType} from './types';

declare global {
  // eslint-disable-next-line no-unused-vars
  var __REDUX_DEVTOOLS_EXTENSION__: any;
}

const getPlugin = () => {
  let storeCache = null;

  const getReduxState = () => {
    const stateElement = document.getElementById('__REDUX_STATE__');
    if (stateElement) {
      return deserialize(unescape(stateElement.textContent));
    }
  };

  return createPlugin<
    {
      reducer: typeof ReducerToken;
      preloadedState: typeof PreloadedStateToken.optional;
      enhancer: typeof EnhancerToken.optional;
      reduxDevToolsConfig: typeof ReduxDevtoolsConfigToken.optional;
    },
    ReactReduxServiceType
  >({
    deps: {
      reducer: ReducerToken,
      preloadedState: PreloadedStateToken.optional,
      enhancer: EnhancerToken.optional,
      reduxDevToolsConfig: ReduxDevtoolsConfigToken.optional,
    },
    provides({reducer, preloadedState, enhancer, reduxDevToolsConfig}) {
      class Redux {
        store: StoreWithContextType<any, any>;
        preloadedState: any;

        constructor(ctx) {
          if (storeCache) {
            // $FlowFixMe
            this.store = storeCache;
          } else {
            // We only use initialState for client-side hydration
            // The real initial state should be derived from the reducer and the @@INIT action
            this.preloadedState = preloadedState || getReduxState();
            const devTool =
              reduxDevToolsConfig !== false &&
              __DEV__ &&
              window.__REDUX_DEVTOOLS_EXTENSION__ &&
              // $FlowFixMe
              __REDUX_DEVTOOLS_EXTENSION__({
                trace: true,
                traceLimit: 25,
                ...((typeof reduxDevToolsConfig === 'object' &&
                  reduxDevToolsConfig) ||
                  {}),
              });
            const enhancers = [enhancer, ctxEnhancer(ctx), devTool].filter(
              Boolean
            );
            // $FlowFixMe
            this.store = createStore(
              reducer,
              this.preloadedState,
              // $FlowFixMe
              compose(...enhancers)
            );
            storeCache = this.store;
          }
        }
      }
      return {
        from: (ctx: Context) => {
          return new Redux(ctx);
        },
      };
    },
    middleware({preloadedState}, redux) {
      return (ctx, next) => {
        // @ts-expect-error todo(flow->ts) TS2339: Property 'preloadedState' does not exist on type '{ ctx?: Context; store: StoreWithContextType ; initStore?: () => Promise  >; }'.
        const {store, preloadedState} = redux.from(ctx);
        ctx.element = (
          <Provider store={store} serverState={preloadedState || {}}>
            {ctx.element}
          </Provider>
        );
        return next();
      };
    },
    cleanup: async () => {
      storeCache = null;
    },
  });
};

export default getPlugin;
