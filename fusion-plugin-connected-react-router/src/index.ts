/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createPlugin } from "fusion-core";
import { applyMiddleware, compose } from "redux";

import {
  routerMiddleware as createRouterMiddleware,
  connectRouter,
} from "connected-react-router";
import { RouterToken } from "fusion-plugin-react-router";

import type { ConnectedRouterPluginType } from "./types";

const plugin: ConnectedRouterPluginType = createPlugin({
  deps: {
    router: RouterToken,
  },
  provides: ({ router }) => {
    const enhancer = (createStore) => {
      return function _createStore(reducer, initialState) {
        const store = createStore(reducer, initialState);
        // $FlowFixMe - We enhance the store to add ctx onto it, which doesn't exist in the redux libdef
        const { history } = router.from(store.ctx);
        const routerReducer = connectRouter(history);
        const combinedReducer = (
          { router: routerState, ...restState } = {},
          action
        ) => {
          /**
           * `reducer` is likely the result of `combineReducers`, which
           * warns if you pass it more state than it expects
           */
          return {
            ...reducer(restState, action),
            router: routerReducer(routerState, action),
          };
        };
        const newStore = createStore(
          combinedReducer,
          initialState,
          compose(applyMiddleware(createRouterMiddleware(history)))
        );
        return newStore;
      };
    };
    return enhancer;
  },
});

export { ConnectedRouterEnhancerToken } from "./tokens";
export default plugin;
