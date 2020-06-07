/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {getSimulator} from 'fusion-test-utils';

import type {FusionPlugin} from 'fusion-core';

import BrowserPerformanceEmitterPlugin from '../src/browser';

/* Fixture */
function createTestFixture() {
  const app = new App('content', el => el);
  app.register(BrowserPerformanceEmitterPlugin);
  return app;
}

// getEntriesByType is not implemented in JSDOM
test.skip('Correct metrics are logged', done => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
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

  expect.assertions(3);
  window.addEventListener('load', () => {
    expect(eventsEmitted.length).toBe(1);
    const event = eventsEmitted[0];
    expect(event.payload.timing).toBe(window.performance.timing);
    expect(event.payload.resourceEntries).toEqual(
      window.performance
        .getEntriesByType('resource')
        .filter(entry => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map(entry => entry.toJSON())
    );

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    done();
  });
});

test('Emits correct event', done => {
  /* Window overrides */
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
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
    ['paintTimes', 'resourceEntries', 'tags', 'timing'].forEach(item => {
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

test('Does not fail when window.performance is null', done => {
  /* Window overrides */
  const oldPerformance = window.performance;
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };
  window.performance = null;

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
    ['paintTimes', 'resourceEntries', 'tags', 'timing'].forEach(item => {
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
