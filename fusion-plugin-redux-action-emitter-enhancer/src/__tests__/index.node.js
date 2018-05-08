/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createStore, compose} from 'redux';
import test from 'tape-cup';

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import type {Context} from 'fusion-core';

import actionEmitterPlugin from '../index.js';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<typeof UniversalEventsToken, ExtractReturnType>;

/* Mocks & Mock Factories */
const getMockEventEmitterFactory = function() {
  const handlers = {};
  const eventEmitterFactory = {
    from(ctx) {
      return {
        on(type, handler) {
          // $FlowFixMe
          handlers[type] = handler;
        },
        emit(type, event) {
          // $FlowFixMe
          handlers[type](event, ctx);
        },
      };
    },
  };
  return ((eventEmitterFactory: any): IEmitter);
};
const sampleReducer = (state = [], action) => {
  switch (action.type) {
    case 'SAMPLE_SET':
      return [
        ...state,
        {
          sample: action.value,
        },
      ];
    default:
      return state;
  }
};

test('Instantiation', t => {
  t.throws(
    actionEmitterPlugin.provides,
    'requires the EventEmitter dependency'
  );
  const mockEventEmitter = getMockEventEmitterFactory();
  t.doesNotThrow(
    () => actionEmitterPlugin.provides({emitter: mockEventEmitter}),
    'provide the EventEmitter dependency'
  );
  t.end();
});

test('Emits actions', t => {
  // Setup
  const mockEventEmitter = getMockEventEmitterFactory();
  const enhancer = actionEmitterPlugin.provides({emitter: mockEventEmitter});
  const mockCtx = {mock: true};
  const mockCtxTyped = ((mockCtx: any): Context);
  const store = createStore(
    sampleReducer,
    [],
    compose(enhancer, createStore => (...args) => {
      const store = createStore(...args);
      // $FlowFixMe
      store.ctx = mockCtx;
      return store;
    })
  );

  // Test Emits
  mockEventEmitter
    .from(mockCtxTyped)
    .on('redux-action-emitter:action', (payload, ctx) => {
      t.equal(
        payload.type,
        'SAMPLE_SET',
        'payload type is SAMPLE_SET, as expected'
      );
      t.equal(payload.value, true, 'payload value is true, as expected');
      t.equal(ctx, mockCtxTyped, 'ctx was provided');
    });
  store.dispatch({
    type: 'SAMPLE_SET',
    value: true,
  });

  t.plan(3);
  t.end();
});
