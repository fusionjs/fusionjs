import {createStore} from 'redux';
import test from 'tape-cup';
import EventEmitter from 'events';
import actionEmitterFunc from '../../index.js';

/* Mocks & Mock Factories */
const getMockEventEmitterFactory = function() {
  const emitter = new EventEmitter();
  return {
    of() {
      return emitter;
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
  const store = createStore(sampleReducer, [], enhancer);

  // Test Emits
  mockEventEmitter.of().on('redux-action-emitter:action', payload => {
    t.equal(
      payload.type,
      'SAMPLE_SET',
      'payload type is SAMPLE_SET, as expected'
    );
    t.equal(payload.value, true, 'payload value is true, as expected');
  });
  store.dispatch({
    type: 'SAMPLE_SET',
    value: true,
  });

  t.plan(2);
  t.end();
});
