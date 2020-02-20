/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {StoreCreator, Reducer} from 'redux';

import App, {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {EnhancerToken} from 'fusion-plugin-react-redux';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import ReduxActionEmitterEnhancer from '../src/index.js';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<typeof UniversalEventsToken, ExtractReturnType>;

const eventsEmitted = [];
const mockEmitter = {
  emit: (type, payload) => {
    eventsEmitted.push({type, payload});
  },
  from: function() {
    return this;
  },
};
const mockEmitterTyped = ((mockEmitter: any): IEmitter);

const mockEmitterPlugin = createPlugin({
  provides: () => mockEmitterTyped,
});

function createTestFixture() {
  const app = new App('content', el => el);
  app.register(EnhancerToken, ReduxActionEmitterEnhancer);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  return app;
}

test('plugin - service resolved as expected', () => {
  const app = createTestFixture();
  let wasResolved = false;

  getSimulator(
    app,
    createPlugin({
      deps: {enhancer: EnhancerToken},
      provides: deps => {
        const {enhancer} = deps;
        expect(enhancer).toBeTruthy();
        const createStore: StoreCreator<*, *, *> = () => {
          return {
            dispatch: () => {},
            getState: () => {},
            subscribe: () => () => {},
            replaceReducer: () => {},
          };
        };
        const mockReducer: Reducer<*, *> = s => s;
        const enhanced = enhancer(createStore)(mockReducer);
        enhanced.dispatch({
          type: 'TEST',
        });
        enhanced.dispatch(function test() {});
        enhanced.dispatch();
        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
  expect(eventsEmitted[0].type).toBe('redux-action-emitter:action');
  expect(eventsEmitted.length).toBe(1);
});
