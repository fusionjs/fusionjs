/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */
import test from 'tape-cup';
import browserPerfCollector from '../enhancedBrowserMetrics';

function mockWindow({performance, ...otherOverrides} = {}) {
  return {
    ...window,
    performance: {
      timing: {},
      getEntriesByType() {
        return [];
      },
      ...performance,
    },
    ...otherOverrides,
  };
}

test('enhancedBrowserMetrics', t => {
  [null, undefined, {}, {performance: {}}, {performance: {timing: {}}}].forEach(
    w => {
      t.deepEqual(
        browserPerfCollector(w),
        {},
        `it should return empty object when window is: ${JSON.stringify(
          w,
          null,
          2
        )}`
      );
    }
  );

  t.deepEqual(
    browserPerfCollector(mockWindow()),
    {
      dimensions: {height: 600, width: 800},
      firstPaint: null,
      memory: undefined,
      navigation: {},
      network: {},
      resources: [],
      server: undefined,
    },
    'it should not error and return sane default values if `performance.timing` and `performance.getEntriesByType(type: string)` are/return empty results'
  );

  t.deepEqual(
    browserPerfCollector(
      mockWindow({
        performance: {
          getEntriesByType(type) {
            switch (type) {
              case 'navigation':
                return [{serverTiming: []}];
              default:
                return [
                  {
                    initiatorType: 'link',
                    name:
                      'http://localhost:5663/trips-viewer/stylesheets/main.css',
                    entryType: 'resource',
                    startTime: 132.92000000000002,
                    duration: 4.435000000000002,
                  },
                ];
            }
          },
        },
      })
    ).server,
    [],
    'it should return the result of `window.performance.getEntriesByType("navigation")[0].serverTiming` as `browserPerfCollector(window).server`'
  );

  t.end();
});
