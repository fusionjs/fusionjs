/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
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
} from '../src/tokens';
import NodePerformanceEmitterPlugin from '../src/server';

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

const mockTimersFactory = shouldExpect => {
  let _numSetInterval = 0;
  return {
    _getNumSetInterval: () => _numSetInterval,
    setInterval: (fn, timeout) => {
      if (shouldExpect) {
        expect(typeof fn).toBe('function');
        expect(typeof timeout).toBe('number');
      }
      fn();
      _numSetInterval++;
      return 5;
    },
    clearInterval: function mockClearInterval(intervalId) {
      _numSetInterval--;
      if (shouldExpect) {
        expect(intervalId).toBe(5);
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
test('FusionApp - service resolved', () => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {perfEmitter: NodePerformanceEmitterToken},
      provides: ({perfEmitter}) => {
        expect(perfEmitter).toBeTruthy();
        wasResolved = true;
      },
    })
  );
  expect(wasResolved).toBeTruthy();
});

test('service - cannot track the same types more than once at a time', () => {
  const perfService = getService(
    createTestFixture,
    NodePerformanceEmitterPlugin
  );

  expect(() => perfService.start()).toThrow();

  // Able to start now that we've stopped
  expect(() => perfService.stop()).not.toThrow();
  expect(() => perfService.start()).not.toThrow();

  expect(() => perfService.stop()).not.toThrow();
  expect(() => perfService.stop()).not.toThrow();
});

test('service - tracking number of timer intervals set', () => {
  const mockTimers = mockTimersFactory(true);
  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(TimersToken, mockTimers);
    app.register(UniversalEventsToken, mockEmitterFactory());
    registerMockConfig(app);
    return app;
  };
  const perfService = getService(appCreator, NodePerformanceEmitterPlugin);

  expect(mockTimers._getNumSetInterval() === 3).toBeTruthy();
  perfService.stop();
  expect(mockTimers._getNumSetInterval() === 0).toBeTruthy();
});

test('service - tracking emit messages', done => {
  const mockEmitter = mockEmitterFactory();
  const mockTimers = mockTimersFactory(true);
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
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:rss`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:externalMemory`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:heapTotal`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:heapUsed`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentSockets`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:gauge:globalAgentRequests`, payload => {
    emitNumberTracker++;
    expect(payload !== undefined).toBeTruthy();
  });
  mockEmitter.on(
    `${EVENT_PLUGIN_NAME}:gauge:globalAgentFreeSockets`,
    payload => {
      emitNumberTracker++;
      expect(payload !== undefined).toBeTruthy();
    }
  );

  const perfService = getService(appCreator, NodePerformanceEmitterPlugin);

  perfService.stop();

  setImmediate(() => {
    expect(emitNumberTracker === 8).toBeTruthy();
    done();
  });
});

test('service - testing garbage collection emits', done => {
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
  let totalDuration = 0;
  mockEmitter.on(`${EVENT_PLUGIN_NAME}:timing:gc`, args => {
    totalDuration += args.duration;
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
    expect(gcMessageReceived).toBeTruthy();
    expect(totalDuration > 0).toBeTruthy();
    done();
  }, 100);
});
