/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
/* eslint-env browser,node */
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

export default createPlugin({
  deps: {
    emitter: UniversalEventsToken,
  },
  provides({emitter}) {
    if (__DEV__ && !emitter) {
      throw new Error(`emitter is required, but was: ${emitter}`);
    }

    return createStore => (...args) => {
      const store = createStore(...args);
      return {
        ...store,
        dispatch: action => {
          emitter.from(store.ctx).emit('redux-action-emitter:action', action);
          return store.dispatch(action);
        },
      };
    };
  },
});
