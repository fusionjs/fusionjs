// @flow
/* eslint-env browser */
/* globals __REDUX_DEVTOOLS_EXTENSION__ */
import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {Plugin} from 'fusion-core';
import {unescape} from 'fusion-core';

export default ({reducer, preloadedState, enhancer}) => {
  return new Plugin({
    Service: class Redux {
      constructor() {
        // We only use initialState for client-side hydration
        // The real initial state should be derived from the reducer and the @@INIT action
        preloadedState =
          preloadedState || // this hook is mostly for testing
          JSON.parse(
            unescape(document.getElementById('__REDUX_STATE__').textContent)
          );
        const devTool =
          __DEV__ &&
          window.__REDUX_DEVTOOLS_EXTENSION__ &&
          __REDUX_DEVTOOLS_EXTENSION__();

        const finalEnhancer = enhancer
          ? devTool ? a => devTool(enhancer(a)) : enhancer
          : devTool || undefined;
        this.store = createStore(reducer, preloadedState, finalEnhancer);
      }
    },
    middleware(ctx, next) {
      const {store} = this.of(ctx);
      ctx.element = <Provider store={store}>{ctx.element}</Provider>;
      return next();
    },
  });
};
