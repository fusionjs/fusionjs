/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {getSimulator} from 'fusion-test-utils';

import BrowserPerformanceEmitterPlugin from '../browser';

/* Fixture */
function createTestFixture() {
  const app = new App('content', el => el);
  app.register(BrowserPerformanceEmitterPlugin);
  return app;
}

/* Tests */
test('Correct metrics are logged', t => {
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
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  t.plan(3);
  window.addEventListener('load', () => {
    t.equal(eventsEmitted.length, 1, 'one event was emitted');
    const event = eventsEmitted[0];
    t.equal(
      event.payload.timing,
      window.performance.timing,
      'Event data are set correctly'
    );
    t.deepEqual(
      event.payload.resourceEntries,
      window.performance
        .getEntriesByType('resource')
        .filter(entry => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map(entry => entry.toJSON()),
      'Event payload have correct data'
    );

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    t.end();
  });
});

test('Emits correct event', t => {
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
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitterPlugin);

  /* Simulator */
  getSimulator(app).render('/');

  t.plan(6);
  window.addEventListener('load', () => {
    t.equal(eventsEmitted.length, 1, 'one event was emitted');
    const event = eventsEmitted[0];
    t.equal(
      event.type,
      'browser-performance-emitter:stats:browser-only',
      'event was emitted with the correct type'
    );
    ['firstPaint', 'resourceEntries', 'tags', 'timing'].forEach(item => {
      t.ok(event.payload.hasOwnProperty(item), 'passed correct payload data');
    });

    /* Revert window overrides */
    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    t.end();
  });
});
