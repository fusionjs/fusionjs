/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createStore, compose} from 'redux';

import App from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import type {Context} from 'fusion-core';
import {getService} from 'fusion-test-utils';

import actionEmitterPlugin, {
  ActionEmitterTransformerToken,
} from '../src/index.js';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<typeof UniversalEventsToken, ExtractReturnType>;

/* Mocks & Mock Factories */
const getMockEventEmitterFactory = function() {
  const handlers = {};
  const eventEmitterFactory = {
    from(ctx) {
      return {
        on(type, handler) {
          handlers[type] = handler;
        },
        emit(type, event) {
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

const appCreator = (deps?: {emitter?: IEmitter, transformer?: Function}) => {
  const {emitter, transformer} = deps || {};

  const app = new App('test', el => el);
  if (emitter) {
    app.register(UniversalEventsToken, emitter);
  }
  if (transformer) {
    app.register(ActionEmitterTransformerToken, transformer);
  }
  return () => app;
};

test('Instantiation', () => {
  const mockEventEmitter = getMockEventEmitterFactory();
  expect(() => getService(appCreator(), actionEmitterPlugin)).toThrow();
  expect(() =>
    getService(appCreator({emitter: mockEventEmitter}), actionEmitterPlugin)
  ).not.toThrow();
});

test('Emits actions', () => {
  // Setup
  const mockEventEmitter = getMockEventEmitterFactory();
  const enhancer = getService(
    appCreator({emitter: mockEventEmitter}),
    actionEmitterPlugin
  );
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
      expect(payload.type).toBe('SAMPLE_SET');
      expect(typeof payload.foo === 'undefined').toBeTruthy();
      expect(ctx).toBe(mockCtxTyped);
    });
  store.dispatch({
    type: 'SAMPLE_SET',
    foo: {bar: 1},
  });

  expect.assertions(3);
});

test('transformers', () => {
  // Setup
  const mockEventEmitter = getMockEventEmitterFactory();

  const enhancer = getService(
    appCreator({
      emitter: mockEventEmitter,
      transformer: action => ({foo: action.foo}),
    }),
    actionEmitterPlugin
  );
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
      expect(payload).toEqual({foo: 1});
      expect(ctx).toBe(mockCtxTyped);
    });
  store.dispatch({
    type: 'SAMPLE_SET',
    foo: 1,
  });

  expect.assertions(2);
});
