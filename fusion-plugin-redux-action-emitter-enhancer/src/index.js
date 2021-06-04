/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser,node */

import type {StoreEnhancer, StoreCreator, Store} from 'redux';
import type {FusionPlugin, Token} from 'fusion-core';

import {createPlugin, createToken} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<typeof UniversalEventsToken, ExtractReturnType>;

export const ActionEmitterTransformerToken: Token<Function> = createToken(
  'ActionEmitterTransformerToken'
);

type PluginDepsType = {
  emitter: typeof UniversalEventsToken,
  transformer: typeof ActionEmitterTransformerToken.optional,
};

type ServiceType = StoreEnhancer<*, *, *>;

const defaultTransformer = (action) => {
  const {type, _trackingMeta} = action;
  return {type, _trackingMeta};
};

const plugin: FusionPlugin<PluginDepsType, ServiceType> = createPlugin({
  deps: {
    emitter: UniversalEventsToken,
    transformer: ActionEmitterTransformerToken.optional,
  },
  provides({
    emitter,
    transformer = defaultTransformer,
  }: {
    emitter: IEmitter,
    transformer?: Function,
  }) {
    if (__DEV__ && !emitter) {
      throw new Error(`emitter is required, but was: ${String(emitter)}`);
    }

    const service: ServiceType =
      (createStore: StoreCreator<*, *, *>) =>
      (...args: *) => {
        const store: Store<*, *, *> = createStore(...args);
        return {
          ...store,
          dispatch: (action: mixed) => {
            if (action && typeof action.type === 'string') {
              let payload: Object = transformer(action);
              if (payload) {
                emitter // $FlowFixMe
                  .from(store.ctx)
                  .emit('redux-action-emitter:action', payload);
              }
            }

            return store.dispatch(action);
          },
        };
      };
    return service;
  },
});

export default plugin;
