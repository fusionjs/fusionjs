// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* eslint-env browser */
import test from 'tape-cup';
import plugin from '../browser.js';

test('Correct metrics are logged', t => {
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  const eventsEmitted = [];
  const EventEmitter = {
    of: function() {
      const emit = (type, payload) => {
        eventsEmitted.push({type, payload});
      };
      return {emit};
    },
  };

  const BrowserPerformanceEmitter = plugin({EventEmitter});
  BrowserPerformanceEmitter.middleware({}, () => {});
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
      window.performance.getEntriesByType('resource').filter(entry => {
        return entry.name.indexOf('data:') !== 0 && entry.toJSON;
      }),
      'Event payload have correct data'
    );

    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    t.end();
  });
});

test('Emits correct event', t => {
  const originalAddEventListener = window.addEventListener;
  const originalSetTimeout = window.setTimeout;

  window.addEventListener = function mockAddEventListener(event, fn) {
    fn();
  };
  window.setTimeout = function mockSetTimeout(fn) {
    fn();
  };

  const eventsEmitted = [];
  const EventEmitter = {
    of: function() {
      const emit = (type, payload) => {
        eventsEmitted.push({type, payload});
      };
      return {emit};
    },
  };

  const BrowserPerformanceEmitter = plugin({EventEmitter});
  BrowserPerformanceEmitter.middleware({}, () => {});
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

    window.addEventListener = originalAddEventListener;
    window.setTimeout = originalSetTimeout;

    t.end();
  });
});
