/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {getSimulator} from 'fusion-test-utils';

import type {FusionPlugin} from 'fusion-core';

import BrowserPerformanceEmitterPlugin from '../browser';

/* Fixture */
function createTestFixture() {
  const app = new App('content', (el) => el);
  app.register(BrowserPerformanceEmitterPlugin);
  return app;
}

/* Mock Results */
const mockResourceTiming = {
  initiatorType: 'link',
  name: 'http://localhost:5663/trips-viewer/stylesheets/main.css',
  entryType: 'resource',
  startTime: 132.92000000000002,
  duration: 4.435000000000002,
};

const mockResourceEntries = [
  {
    ...mockResourceTiming,
    toJSON: () => mockResourceTiming,
  },
];

const mockNavigationTiming = {
  name: 'http://localhost:3000/',
  entryType: 'navigation',
  startTime: 0,
  duration: 4835.399999976158,
  initiatorType: 'navigation',
  nextHopProtocol: 'http/1.1',
  renderBlockingStatus: 'blocking',
  workerStart: 0,
  redirectStart: 0,
  redirectEnd: 0,
  fetchStart: 0.5999999642372131,
  domainLookupStart: 0.5999999642372131,
  domainLookupEnd: 0.5999999642372131,
  connectStart: 0.5999999642372131,
  connectEnd: 0.5999999642372131,
  secureConnectionStart: 0,
  requestStart: 40.39999997615814,
  responseStart: 4520.5,
  responseEnd: 4525.699999988079,
  transferSize: 21896,
  encodedBodySize: 21596,
  decodedBodySize: 21596,
  serverTiming: [],
  unloadEventStart: 4535.5,
  unloadEventEnd: 4535.699999988079,
  domInteractive: 4622.699999988079,
  domContentLoadedEventStart: 4746.399999976158,
  domContentLoadedEventEnd: 4747.099999964237,
  domComplete: 4834.099999964237,
  loadEventStart: 4835.199999988079,
  loadEventEnd: 4835.399999976158,
  type: 'reload',
  redirectCount: 0,
  activationStart: 0,
};

const mockNavigationEntries = [
  {
    ...mockNavigationTiming,
    toJSON: () => mockNavigationTiming,
  },
];

const mockTimeOrigin = 1671760014938.6;

const mockTimingResult = {
  navigationStart: 1671760014938,
  connectStart: 1671760014939,
  secureConnectionStart: 0,
  fetchStart: 1671760014939,
  domContentLoadedEventStart: 1671760019685,
  responseStart: 1671760019459,
  domInteractive: 1671760019561,
  domainLookupEnd: 1671760014939,
  responseEnd: 1671760019464,
  redirectStart: 0,
  requestStart: 1671760014979,
  unloadEventEnd: 1671760019474,
  unloadEventStart: 1671760019474,
  domLoading: 1671760019561,
  domComplete: 1671760019772,
  domainLookupStart: 1671760014939,
  loadEventStart: 1671760019773,
  domContentLoadedEventEnd: 1671760019685,
  loadEventEnd: 1671760019774,
  redirectEnd: 0,
  connectEnd: 1671760014939,
};

const mockTiming = {
  ...mockTimingResult,
  toJSON: () => mockTimingResult,
};

test('Correct metrics are logged', (done) => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;
  const originalPerformance = window.performance;

  // getEntriesByType is not implemented in JSDOM
  const performance = {
    getEntriesByType: (type: string) => {
      if (type === 'resource') {
        return mockResourceEntries;
      } else if (type === 'navigation') {
        return mockNavigationEntries;
      }

      return [];
    },
    timeOrigin: mockTimeOrigin,
    timing: mockTiming,
  };

  Object.defineProperty(window, 'performance', {
    configurable: true,
    enumerable: true,
    value: performance,
    writable: true,
  });

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  // @ts-ignore
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  /* App registration */
  const eventsEmitted = [];
  const mockEmitter = {
    emit: (type: string, payload: any) => {
      eventsEmitted.push({type, payload});
    },
  };
  const mockEmitterPlugin: FusionPlugin<any, any> = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  expect.assertions(3);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];

    expect(event.payload.timing).toEqual(mockTimingResult);
    expect(event.payload.resourceEntries).toEqual(
      window.performance
        .getEntriesByType('resource')
        .filter((entry) => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map((entry) => entry.toJSON())
    );

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;
    window.performance = originalPerformance;

    done();
  });
});

test('Correct metrics are logged with performance.timing removed', (done) => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;
  const originalPerformance = window.performance;

  // getEntriesByType is not implemented in JSDOM
  const performance = {
    getEntriesByType: (type: string) => {
      if (type === 'resource') {
        return mockResourceEntries;
      } else if (type === 'navigation') {
        return mockNavigationEntries;
      }

      return [];
    },
    timeOrigin: mockTimeOrigin,
    timing: undefined,
  };

  Object.defineProperty(window, 'performance', {
    configurable: true,
    enumerable: true,
    value: performance,
    writable: true,
  });

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  // @ts-ignore
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  /* App registration */
  const eventsEmitted = [];
  const mockEmitter = {
    emit: (type: string, payload: any) => {
      eventsEmitted.push({type, payload});
    },
  };
  const mockEmitterPlugin: FusionPlugin<any, any> = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  expect.assertions(3);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];

    expect(event.payload.timing).toEqual(mockTimingResult);
    expect(event.payload.resourceEntries).toEqual(
      window.performance
        .getEntriesByType('resource')
        .filter((entry) => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map((entry) => entry.toJSON())
    );

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;
    window.performance = originalPerformance;

    done();
  });
});

test('Correct metrics are logged with Navigation removed', (done) => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;
  const originalPerformance = window.performance;

  // getEntriesByType is not implemented in JSDOM
  const performance = {
    getEntriesByType: (type: string) => {
      if (type === 'resource') {
        return mockResourceEntries;
      }

      return [];
    },
    timeOrigin: mockTimeOrigin,
    timing: mockTiming,
  };

  Object.defineProperty(window, 'performance', {
    configurable: true,
    enumerable: true,
    value: performance,
    writable: true,
  });

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  // @ts-ignore
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  /* App registration */
  const eventsEmitted = [];
  const mockEmitter = {
    emit: (type: string, payload: any) => {
      eventsEmitted.push({type, payload});
    },
  };
  const mockEmitterPlugin: FusionPlugin<any, any> = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  expect.assertions(3);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];

    expect(event.payload.timing).toEqual(mockTimingResult);
    expect(event.payload.resourceEntries).toEqual(
      window.performance
        .getEntriesByType('resource')
        .filter((entry) => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map((entry) => entry.toJSON())
    );

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;
    window.performance = originalPerformance;

    done();
  });
});

test('Emits correct event', (done) => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  // @ts-ignore
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  /* App registration */
  const eventsEmitted = [];
  const mockEmitter = {
    emit: (type, payload) => {
      eventsEmitted.push({type, payload});
    },
  };
  const mockEmitterPlugin: FusionPlugin<any, any> = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  expect.assertions(6);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];
    expect(event.type).toBe('browser-performance-emitter:stats:browser-only');
    ['paintTimes', 'resourceEntries', 'tags', 'timing'].forEach((item) => {
      expect(
        Object.prototype.hasOwnProperty.call(event.payload, item)
      ).toBeTruthy();
    });

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    done();
  });
});

test('Does not fail when window.performance is null', (done) => {
  /* Window overrides */
  const oldPerformance = window.performance;
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  // @ts-ignore
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };
  window.performance = null;

  /* App registration */
  const eventsEmitted = [];
  const mockEmitter = {
    emit: (type: string, payload: any) => {
      eventsEmitted.push({type, payload});
    },
  };
  const mockEmitterPlugin: FusionPlugin<any, any> = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  expect.assertions(6);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];
    expect(event.type).toBe('browser-performance-emitter:stats:browser-only');
    ['paintTimes', 'resourceEntries', 'tags', 'timing'].forEach((item) => {
      expect(
        Object.prototype.hasOwnProperty.call(event.payload, item)
      ).toBeTruthy();
    });

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;
    window.performance = oldPerformance;

    done();
  });
});
