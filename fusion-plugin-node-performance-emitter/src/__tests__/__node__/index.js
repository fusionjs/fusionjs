/* eslint-env node */
import test from 'tape-cup';
import plugin from '../../server.js';

/* Constants */
const EVENT_PLUGIN_NAME = 'node-performance-emitter';

/* Mock Factories */
const getMockEventEmitterFactory = function() {
  const onHandlers = [];
  return {
    of: function() {
      return {
        on: function(type, handler) {
          onHandlers.push({type, handler});
        },
        emit: function(type, event) {
          onHandlers.filter(o => o.type == type).forEach(o => o.handler(event));
        },
      };
    },
  };
};
const getMockTimers = t => {
  let _numSetInterval = 0;
  return {
    _getNumSetInterval: () => _numSetInterval,
    setInterval: (fn, timeout) => {
      if (t) {
        t.equals(typeof fn, 'function', 'passes a function into setInterval');
        t.equals(typeof timeout, 'number', 'passes a number into setInterval');
      }
      fn();
      _numSetInterval++;
      return 5;
    },
    clearInterval: function mockClearInterval(intervalId) {
      _numSetInterval--;
      if (t) {
        t.equals(intervalId, 5, 'clears the interval correctly');
      }
    },
  };
};

test('cannot track the same types more than once at a time', t => {
  const mockEventEmitter = getMockEventEmitterFactory();
  const perfService = plugin({EventEmitter: mockEventEmitter}).of();

  t.throws(() => perfService.start(), 'already running trackers cannot start');

  // Able to start now that we've stopped
  t.doesNotThrow(() => perfService.stop(), 'service can be stopped');
  t.doesNotThrow(
    () => perfService.start(),
    'service can run if the trackers are not active'
  );

  t.doesNotThrow(() => perfService.stop(), 'service can be stopped');
  t.doesNotThrow(
    () => perfService.stop(),
    'stopped service can remain stopped'
  );

  t.end();
});

test('tracking number of timer intervals set', t => {
  const mockEventEmitter = getMockEventEmitterFactory();
  const mockTimers = getMockTimers(t);

  const perfService = plugin({
    EventEmitter: mockEventEmitter,
    timers: mockTimers,
  }).of();
  t.assert(
    mockTimers._getNumSetInterval() === 3,
    'socket usage, event loop, and memory intervals should be set'
  );
  perfService.stop();
  t.assert(
    mockTimers._getNumSetInterval() === 0,
    'when stopped, no timer intervals should be set'
  );

  t.end();
});

test('tracking emit messages', t => {
  const mockEventEmitter = getMockEventEmitterFactory();
  const mockTimers = getMockTimers();

  // Register to listen to emits
  let emitNumberTracker = 0;
  mockEventEmitter
    .of()
    .on(`${EVENT_PLUGIN_NAME}:gauge:event_loop_lag`, payload => {
      emitNumberTracker++;
      t.assert(payload !== undefined, 'event_loop_lag: message received');
    });
  mockEventEmitter.of().on(`${EVENT_PLUGIN_NAME}:gauge:rss`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'rss: message received');
  });
  mockEventEmitter
    .of()
    .on(`${EVENT_PLUGIN_NAME}:gauge:externalMemory`, payload => {
      emitNumberTracker++;
      t.assert(payload !== undefined, 'externalMemory: message received');
    });
  mockEventEmitter.of().on(`${EVENT_PLUGIN_NAME}:gauge:heapTotal`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'heapTotal: message received');
  });
  mockEventEmitter.of().on(`${EVENT_PLUGIN_NAME}:gauge:heapUsed`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'heapUsed: message received');
  });
  mockEventEmitter
    .of()
    .on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentSockets`, payload => {
      emitNumberTracker++;
      t.assert(payload !== undefined, 'globalAgentSockets: message received');
    });
  mockEventEmitter
    .of()
    .on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentRequests`, payload => {
      emitNumberTracker++;
      t.assert(payload !== undefined, 'globalAgentRequests: message received');
    });
  mockEventEmitter
    .of()
    .on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentFreeSockets`, payload => {
      emitNumberTracker++;
      t.assert(
        payload !== undefined,
        'globalAgentFreeSockets: message received'
      );
    });

  const perfService = plugin({
    EventEmitter: mockEventEmitter,
    timers: mockTimers,
  }).of();

  perfService.stop();

  setImmediate(() => {
    t.assert(emitNumberTracker === 8, 'all emits should be captured');
    t.end();
  });
});

test('testing garbage collection emits', t => {
  const mockEventEmitter = getMockEventEmitterFactory();
  const mockTimers = getMockTimers();

  // Register to listen to emits
  let gcMessageReceived = false;
  mockEventEmitter.of().on(`${EVENT_PLUGIN_NAME}:timing:gc`, () => {
    gcMessageReceived = true;
  });

  const perfService = plugin({
    EventEmitter: mockEventEmitter,
    timers: mockTimers,
  }).of();
  perfService.startTrackingGCUsage();

  // Make some garbage!
  var myTracker = [];
  for (var i = 0; i < 1000000; i++) {
    myTracker.push({lotsof: 'garbage'});
  }
  myTracker = [];

  setTimeout(() => {
    perfService.stopTrackingGCUsage();
    t.assert(gcMessageReceived, 'gc: message was received');
    t.end();
  }, 100);
});
