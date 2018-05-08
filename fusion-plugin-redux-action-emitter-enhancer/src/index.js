/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser,node */

import type {StoreEnhancer, StoreCreator, Store} from 'redux';

import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<typeof UniversalEventsToken, ExtractReturnType>;

const plugin = createPlugin({
  deps: {
    emitter: UniversalEventsToken,
  },
  provides({emitter}: {emitter: IEmitter}) {
    if (__DEV__ && !emitter) {
      throw new Error(`emitter is required, but was: ${emitter}`);
    }

    const service: StoreEnhancer<*, *, *> = (
      createStore: StoreCreator<*, *, *>
    ) => (...args: *) => {
      const store: Store<*, *, *> = createStore(...args);
      return {
        ...store,
        dispatch: action => {
          // $FlowFixMe
          emitter.from(store.ctx).emit('redux-action-emitter:action', action);
          return store.dispatch(action);
        },
      };
    };
    return service;
  },
});

export default plugin;
