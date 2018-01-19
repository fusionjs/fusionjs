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

// @flow
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
