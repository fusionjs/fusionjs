import {createStore, compose} from 'redux';
import test from 'tape-cup';
import actionEmitterFunc from '../../index.js';

/* Mocks & Mock Factories */
const getMockEventEmitterFactory = function() {
  const handlers = {};
  return {
    of(ctx) {
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
  t.throws(actionEmitterFunc, 'requires the EventEmitter dependency');
  const mockEventEmitter = getMockEventEmitterFactory();
  t.doesNotThrow(
    () => actionEmitterFunc(mockEventEmitter),
    'provide the EventEmitter dependency'
  );
  t.end();
});
test('Emits actions', t => {
  // Setup
  const mockEventEmitter = getMockEventEmitterFactory();
  const enhancer = actionEmitterFunc(mockEventEmitter);
  const mockCtx = {mock: true};
  const store = createStore(
    sampleReducer,
    [],
    compose(enhancer, createStore => (...args) => {
      const store = createStore(...args);
      store.ctx = mockCtx;
      return store;
    })
  );

  // Test Emits
  mockEventEmitter
    .of(mockCtx)
    .on('redux-action-emitter:action', (payload, ctx) => {
      t.equal(
        payload.type,
        'SAMPLE_SET',
        'payload type is SAMPLE_SET, as expected'
      );
      t.equal(payload.value, true, 'payload value is true, as expected');
      t.equal(ctx, mockCtx, 'ctx was provided');
    });
  store.dispatch({
    type: 'SAMPLE_SET',
    value: true,
  });

  t.plan(3);
  t.end();
});
