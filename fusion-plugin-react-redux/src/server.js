import React from 'react';
import {compose} from 'redux';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {createPlugin, memoize, html} from 'fusion-core';
import ctxEnhancer from './ctx-enhancer';
import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  InitialStateToken,
} from './tokens.js';

export default createPlugin({
  deps: {
    reducer: ReducerToken,
    preloadedState: PreloadedStateToken,
    enhancer: EnhancerToken,
    getInitialState: InitialStateToken,
  },
  provides({reducer, preloadedState, enhancer, getInitialState}) {
    class Redux {
      constructor(ctx) {
        // We only use initialState for client-side hydration
        // The real initial state should be derived from the reducer and the @@INIT action
        this.ctx = ctx;
        this.store = null;
      }
      async initStore() {
        if (this.store) {
          return this.store;
        }
        if (getInitialState) {
          preloadedState = Object.assign(
            {},
            preloadedState,
            await getInitialState(this.ctx)
          );
        }
        const enhancers = [enhancer, ctxEnhancer(this.ctx)].filter(Boolean);
        this.store = createStore(
          reducer,
          preloadedState,
          compose(...enhancers)
        );
        return this.store;
      }
    }
    return {
      from: memoize(ctx => new Redux(ctx)),
    };
  },
  middleware(_, redux) {
    return async (ctx, next) => {
      if (!ctx.element) return next();
      const store = await redux.from(ctx).initStore();
      ctx.element = <Provider store={store}>{ctx.element}</Provider>;
      await next();

      const serialized = JSON.stringify(store.getState());
      const script = html`<script type="application/json" id="__REDUX_STATE__">${
        serialized
      }</script>`;
      ctx.template.body.push(script);
    };
  },
});
