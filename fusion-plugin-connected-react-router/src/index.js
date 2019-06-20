/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin} from 'fusion-core';
import {applyMiddleware, compose, combineReducers} from 'redux';
import reduceReducers from 'reduce-reducers';

import {
  routerMiddleware as createRouterMiddleware,
  connectRouter,
} from 'connected-react-router';
import {RouterToken} from 'fusion-plugin-react-router';

import type {ConnectedRouterPluginType} from './types';

const plugin: ConnectedRouterPluginType = createPlugin({
  deps: {
    router: RouterToken,
  },
  provides: ({router}) => {
    const enhancer = (createStore, ctx) => {
      return function _createStore(reducer, initialState, middlewares) {
        const {history} = router.from(ctx);
        const routerReducer = connectRouter(history);
        const combinedReducer = ({ router: routerState, ...restState } = {}, action) => {
          /**
           * `reducer` is likely the result of `combineReducers`, which
           * warns if you pass it more state than it expects
           */
          return {
            ...reducer(restState, action),
            router: routerReducer(routerState, action),
          };
        };
        const store = createStore(
          combinedReducer,
          initialState,
           compose(
             applyMiddleware(
               createRouterMiddleware(history),
             ),
           ),
        );
        return store;
      };
    };
    return enhancer;
  },
});

export {ConnectedRouterEnhancerToken} from './tokens';
export default plugin;
