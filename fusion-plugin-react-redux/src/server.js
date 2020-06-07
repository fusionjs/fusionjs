/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {compose, createStore} from 'redux';
import {Provider} from 'react-redux';

import {createPlugin, memoize, html} from 'fusion-core';
import type {FusionPlugin, Context} from 'fusion-core';

import ctxEnhancer from './ctx-enhancer';
import {serialize} from './codec.js';
import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  GetInitialStateToken,
} from './tokens.js';
import type {
  StoreWithContextType,
  ReactReduxDepsType,
  ReactReduxServiceType,
} from './types.js';

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      reducer: ReducerToken,
      preloadedState: PreloadedStateToken.optional,
      enhancer: EnhancerToken.optional,
      getInitialState: GetInitialStateToken.optional,
    },
    provides({reducer, preloadedState, enhancer, getInitialState}) {
      class Redux {
        ctx: Context;
        store: ?StoreWithContextType<*, *, *>;

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
          // $FlowFixMe
          this.store = createStore(
            reducer,
            preloadedState,
            // $FlowFixMe
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

        const serialized = serialize(store.getState());
        const script = html`
          <script type="application/json" id="__REDUX_STATE__">
            ${serialized}
          </script>
        `;
        ctx.template.body.push(script);
      };
    },
  });

export default ((plugin: any): FusionPlugin<
  ReactReduxDepsType,
  ReactReduxServiceType
>);
