/* eslint-env browser */
/* globals __REDUX_DEVTOOLS_EXTENSION__ */

import React from 'react';
import {Provider} from 'react-redux';
import {compose, createStore} from 'redux';
import {Plugin} from 'fusion-core';
import {unescape} from 'fusion-core';

export default ({reducer, preloadedState, enhancer}) => {
  return new Plugin({
    Service: class Redux {
      constructor() {
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

        let finalEnhancer;
        if (enhancer || devTool) {
          finalEnhancer = compose(...[enhancer, devTool].filter(Boolean));
        }
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
