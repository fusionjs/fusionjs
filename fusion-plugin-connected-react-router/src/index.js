/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin} from 'fusion-core';

import {
  routerMiddleware as createRouterMiddleware,
  connectRouter,
} from 'connected-react-router';
import {RouterToken} from 'fusion-plugin-react-router';
import {combineReducers} from 'redux';
import reduceReducers from 'reduce-reducers';

import type {ConnectedRouterPluginType} from './types';

const plugin: ConnectedRouterPluginType = createPlugin({
  deps: {
    router: RouterToken,
  },
  provides: ({router}) => {
    const enhancer = createStore => {
      return function _createStore(reducer, initialState) {
        const store = createStore(reducer, initialState);
        // $FlowFixMe - We enhance the store to add ctx onto it, which doesn't exist in the redux libdef
        const {history} = router.from(store.ctx);
        const routerReducer = combineReducers({
          router: connectRouter(history),
        });
        const rootReducer = reduceReducers(routerReducer, reducer);
        store.replaceReducer(rootReducer);
        const oldDispatch = store.dispatch;
        const routerMiddleware = createRouterMiddleware(history)(store);
        store.dispatch = action => {
          return routerMiddleware(function next(action) {
            return oldDispatch(action);
          })(action);
        };
        return store;
      };
    };
    return enhancer;
  },
});

export {ConnectedRouterEnhancerToken} from './tokens';
export default plugin;
