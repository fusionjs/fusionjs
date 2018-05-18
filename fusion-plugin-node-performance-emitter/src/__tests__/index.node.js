/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import test from 'tape-cup';
import MockEmitter from 'events';

import App, {createPlugin} from 'fusion-core';
import {getSimulator, getService} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {
  NodePerformanceEmitterToken,
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken,
} from '../tokens';
import NodePerformanceEmitterPlugin from '../server';

/* Constants */
const EVENT_PLUGIN_NAME = 'node-performance-emitter';

/* Mocks */
const mockConfig = {
  eventLoopLagInterval: 1,
  memoryInterval: 10,
  socketInterval: 100,
};

const mockEmitterFactory = () => {
  const mockEmitter = new MockEmitter();
  // $FlowFixMe
  mockEmitter.from = () => mockEmitter;
  return (mockEmitter: any);
};

const mockTimersFactory = t => {
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

/* Fixtures */
function createTestFixture() {
  const mockTimers = mockTimersFactory();
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitterFactory(),
  });

  const app = new App('content', el => el);
  app.register(NodePerformanceEmitterToken, NodePerformanceEmitterPlugin);
  app.register(TimersToken, mockTimers);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  return app;
}

function registerMockConfig(app) {
  app.register(EventLoopLagIntervalToken, mockConfig.eventLoopLagInterval);
  app.register(MemoryIntervalToken, mockConfig.memoryInterval);
  app.register(SocketIntervalToken, mockConfig.socketInterval);
}

/* Tests */
test('FusionApp - service resolved', t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {perfEmitter: NodePerformanceEmitterToken},
      provides: ({perfEmitter}) => {
        t.ok(perfEmitter);
        wasResolved = true;
      },
    })
  );
  t.true(wasResolved, 'service was resolved');

  t.end();
});

test('service - cannot track the same types more than once at a time', t => {
  const perfService = getService(
    createTestFixture,
    NodePerformanceEmitterPlugin
  );

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

test('service - tracking number of timer intervals set', t => {
  const mockTimers = mockTimersFactory(t);
  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(TimersToken, mockTimers);
    app.register(UniversalEventsToken, mockEmitterFactory());
    registerMockConfig(app);
    return app;
  };
  const perfService = getService(appCreator, NodePerformanceEmitterPlugin);

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

test('service - tracking emit messages', t => {
  const mockEmitter = mockEmitterFactory();
  const mockTimers = mockTimersFactory();
  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(TimersToken, mockTimers);
    app.register(UniversalEventsToken, mockEmitter);
    registerMockConfig(app);
    return app;
  };

  // Register to listen to emits
  let emitNumberTracker = 0;
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:event_loop_lag`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'event_loop_lag: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:rss`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'rss: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:externalMemory`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'externalMemory: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:heapTotal`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'heapTotal: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:heapUsed`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'heapUsed: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentSockets`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'globalAgentSockets: message received');
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentRequests`, payload => {
    emitNumberTracker++;
    t.assert(payload !== undefined, 'globalAgentRequests: message received');
  });
  mockEmitter.on(
    `${EVENT_PLUGIN_NAME}:gauge:globalAgentFreeSockets`,
    payload => {
      emitNumberTracker++;
      t.assert(
        payload !== undefined,
        'globalAgentFreeSockets: message received'
      );
    }
  );

  const perfService = getService(appCreator, NodePerformanceEmitterPlugin);

  perfService.stop();

  setImmediate(() => {
    t.assert(emitNumberTracker === 8, 'all emits should be captured');
    t.end();
  });
});

test('service - testing garbage collection emits', t => {
  const mockEmitter = mockEmitterFactory();
  const mockTimers = mockTimersFactory();
  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(TimersToken, mockTimers);
    app.register(UniversalEventsToken, mockEmitter);
    registerMockConfig(app);
    return app;
  };

  // Register to listen to emits
  let gcMessageReceived = false;
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:timing:gc`, () => {
    gcMessageReceived = true;
  });

  const perfService = getService(appCreator, NodePerformanceEmitterPlugin);
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
