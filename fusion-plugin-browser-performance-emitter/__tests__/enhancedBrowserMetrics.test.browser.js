/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */
import browserPerfCollector from '../src/helpers/enhancedBrowserMetrics';

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

test('enhancedBrowserMetrics', () => {
  [null, undefined, {}, {performance: {}}, {performance: {timing: {}}}].forEach(
    w => {
      expect(browserPerfCollector(w)).toEqual({});
    }
  );

  const data = browserPerfCollector(mockWindow());
  // test variable data first
  expect(
    typeof data.navigationMeta.time === 'number' && data.navigationMeta.time > 0
  ).toBeTruthy();
  expect(
    typeof data.navigationMeta.url === 'string' &&
      data.navigationMeta.url.startsWith(`http://localhost/`)
  ).toBeTruthy();
  // test the rest
  expect(data).toEqual({
    dimensions: {height: 0, width: 0},
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
  });

  expect(
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
    ).server
  ).toEqual([]);
});
