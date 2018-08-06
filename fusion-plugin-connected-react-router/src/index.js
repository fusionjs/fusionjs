/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {StoreEnhancer} from 'redux';
import {createPlugin, createToken} from 'fusion-core';
import type {Token} from 'fusion-core';
import {
  routerMiddleware as createRouterMiddleware,
  connectRouter,
} from 'connected-react-router';
import {RouterToken} from 'fusion-plugin-react-router';

export const ConnectedRouterEnhancerToken: Token<
  StoreEnhancer<*, *, *>
> = createToken('ConnectedRouterEnhancer');

export default createPlugin({
  deps: {
    router: RouterToken,
  },
  provides: ({router}) => {
    const enhancer = createStore => {
      return function _createStore(reducer, initialState) {
        const store = createStore(reducer, initialState);
        const {history} = router.from(store.ctx);
        store.replaceReducer(connectRouter(history)(reducer));
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
