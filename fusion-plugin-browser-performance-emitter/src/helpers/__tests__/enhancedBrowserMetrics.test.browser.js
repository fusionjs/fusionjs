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
      memory: {},
      ...performance,
    },
    navigator: {
      connection: {},
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

  const data = browserPerfCollector(mockWindow());
  // test variable data first
  t.ok(
    typeof data.navigationMeta.time === 'number' && data.navigationMeta.time > 0
  );
  t.ok(
    typeof data.navigationMeta.url === 'string' &&
      data.navigationMeta.url.startsWith(`http://localhost:`)
  );
  // test the rest
  t.deepEqual(
    data,
    {
      dimensions: {height: 600, width: 800},
      memory: {},
      navigation: {},
      navigationMeta: {
        hostname: 'localhost',
        page: '/',
        pathname: '/',
        referrer: '',
        time: data.navigationMeta.time,
        url: data.navigationMeta.url,
      },
      network: {},
      paintTimes: {firstContentfulPaint: null, firstPaint: null},
      renderTimes: {clientRenderStart: null, firstRenderStart: null},
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
