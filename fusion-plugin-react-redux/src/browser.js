/* eslint-env browser */
/* globals __REDUX_DEVTOOLS_EXTENSION__ */

import React from 'react';
import {Provider} from 'react-redux';
import {compose, createStore} from 'redux';
import {createPlugin} from 'fusion-core';
import {unescape} from 'fusion-core';
import ctxEnhancer from './ctx-enhancer';
import {ReducerToken, PreloadedStateToken, EnhancerToken} from './tokens.js';

export default createPlugin({
  deps: {
    reducer: ReducerToken,
    preloadedState: PreloadedStateToken,
    enhancer: EnhancerToken,
  },
  provides({reducer, preloadedState, enhancer}) {
    class Redux {
      constructor(ctx) {
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
          __REDUX_DEVTOOLS_EXTENSION__();

        const enhancers = [enhancer, ctxEnhancer(ctx), devTool].filter(Boolean);
        this.store = createStore(
          reducer,
          preloadedState,
          compose(...enhancers)
        );
      }
    }
    return {
      from(ctx) {
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
