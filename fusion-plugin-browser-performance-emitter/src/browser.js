/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';

class BrowserPerformanceEmitter {
  constructor() {
    this.tags = {route: window.location.href};
  }

  calculate(timing, resourceEntries) {
    if (
      (!window.performance ||
        !window.performance.timing ||
        !window.performance.getEntriesByType) &&
      (!timing && !resourceEntries)
    ) {
      return;
    }

    timing = timing || window.performance.timing;
    resourceEntries =
      resourceEntries ||
      window.performance
        .getEntriesByType('resource')
        .filter(entry => {
          return entry.name.indexOf('data:') !== 0 && entry.toJSON;
        })
        .map(entry => entry.toJSON());

    const firstPaint = this.getFirstPaint();

    return {
      timing,
      resourceEntries,
      firstPaint,
    };
  }

  /* Helper methods */
  getFirstPaint() {
    if (!window.performance) return null;

    if (window.chrome && window.chrome.loadTimes) {
      // Chrome
      const firstPaint = window.chrome.loadTimes().firstPaintTime * 1000;
      return firstPaint - window.chrome.loadTimes().startLoadTime * 1000;
    } else if (typeof window.performance.timing.msFirstPaint === 'number') {
      // IE
      const firstPaint = window.performance.timing.msFirstPaint;
      return firstPaint - window.performance.timing.navigationStart;
    }

    return null;
  }
}

export default createPlugin({
  deps: {emitter: UniversalEventsToken},
  middleware: deps => {
    const emitter = deps.emitter;
    const emit = payload => {
      emitter.emit('browser-performance-emitter:stats:browser-only', payload);
    };

    return async (ctx, next) => {
      const browserPerformanceEmitter = new BrowserPerformanceEmitter();

      window.addEventListener('load', () => {
        // window.performance.timing.loadEventEnd not ready until the next tick
        window.setTimeout(() => {
          // for testing purposes pass timing and resourceEntries from options
          const {
            timing,
            resourceEntries,
            firstPaint,
          } = browserPerformanceEmitter.calculate();
          emit({
            timing,
            resourceEntries,
            firstPaint,
            tags: browserPerformanceEmitter.tags,
          });
        }, 0);
      });

      return next();
    };
  },
});
