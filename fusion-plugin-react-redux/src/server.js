// @flow
import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {html} from 'fusion-core';
import {Plugin} from 'fusion-core';

export default ({reducer, preloadedState, enhancer, getInitialState}) => {
  return new Plugin({
    Service: class Redux {
      constructor() {
        // We only use initialState for client-side hydration
        // The real initial state should be derived from the reducer and the @@INIT action
        this.store = null;
      }
      async initStore(ctx) {
        if (this.store) {
          return this.store;
        }
        if (getInitialState) {
          preloadedState = Object.assign(
            {},
            preloadedState,
            await getInitialState(ctx)
          );
        }
        this.store = createStore(reducer, preloadedState, enhancer);
        return this.store;
      }
    },
    async middleware(ctx, next) {
      if (!ctx.element) return next();
      const store = await this.of(ctx).initStore(ctx);
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
