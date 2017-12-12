import React from 'react';
import {compose} from 'redux';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {html} from 'fusion-core';
import {Plugin} from 'fusion-core';
import ctxEnhancer from './ctx-enhancer';

export default ({reducer, preloadedState, enhancer, getInitialState}) => {
  return new Plugin({
    Service: class Redux {
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
    },
    async middleware(ctx, next) {
      if (!ctx.element) return next();
      const store = await this.of(ctx).initStore();
      ctx.element = <Provider store={store}>{ctx.element}</Provider>;
      await next();

      const serialized = JSON.stringify(store.getState());
      const script = html`<script type="application/json" id="__REDUX_STATE__">${
        serialized
      }</script>`;
      ctx.body.body.push(script);
    },
  });
};
