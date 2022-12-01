/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser,node */

import type { StoreEnhancer, StoreCreator, Store } from "redux";
import type { FusionPlugin, Token } from "fusion-core";

import { createPlugin, createToken } from "fusion-core";
import { UniversalEventsToken } from "fusion-plugin-universal-events";

type $Call1<F extends (...args: any) => any, A> = F extends (
  a: A,
  ...args: any
) => infer R
  ? R
  : never;
type ExtractReturnType = <V>(a: () => V) => V;
type IEmitter = $Call1<typeof UniversalEventsToken, ExtractReturnType>;

export const ActionEmitterTransformerToken: Token<Function> = createToken(
  "ActionEmitterTransformerToken"
);

type PluginDepsType = {
  emitter: typeof UniversalEventsToken;
  transformer: typeof ActionEmitterTransformerToken.optional;
};

type ServiceType = StoreEnhancer<any, any, any>;

const defaultTransformer = (action) => {
  const { type, _trackingMeta } = action;
  return { type, _trackingMeta };
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
    emitter: IEmitter;
    transformer?: Function;
  }) {
    if (__DEV__ && !emitter) {
      throw new Error(`emitter is required, but was: ${String(emitter)}`);
    }

    const service: ServiceType =
      (createStore: StoreCreator<any, any, any>) =>
      (...args: any) => {
        const store: Store<any, any, any> = createStore(...args);
        return {
          ...store,
          dispatch: (action: unknown) => {
            if (action && typeof action.type === "string") {
              let payload: any = transformer(action);
              if (payload) {
                emitter // $FlowFixMe
                  .from(store.ctx)
                  .emit("redux-action-emitter:action", payload);
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
