/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {TIMING_KEYS} from '../constants';
import type {
  DimensionsType,
  EnhancedMetricsType,
  MemoryType,
  NavigationMetaType,
  NetworkInformationType,
  PaintTimesType,
  PerformanceTiming,
  RenderTimesType,
  ResourcesType,
} from '../types';
import {getTimeFromMarks} from '../utils';

function hasPerf(window: Window) {
  return Boolean(
    window && window.performance && window.performance.getEntriesByType
  );
}

function getNavigationTiming(window: Window): ResourcesType {
  const navigationTiming = window.performance
    .getEntriesByType('navigation')
    .filter((entry) => {
      return entry.entryType === 'navigation' && entry.toJSON;
    })
    .map((entry) => entry.toJSON());

  return navigationTiming;
}

function getEntries(window: Window): ResourcesType {
  const resources = window.performance.getEntriesByType('resource');
  const jsonResources = resources.filter(
    (entry) => entry.name.indexOf('data:') !== 0 && entry.toJSON
  );
  const navigations = window.performance.getEntriesByType('navigation');
  const html = navigations.filter(
    (entry) => entry.entryType === 'navigation' && entry.toJSON
  );
  return jsonResources.concat(html).map(function (entry) {
    return entry.toJSON();
  });
}

function getServerTiming(window: Window): PerformanceServerTiming {
  const navigationTiming = window.performance.getEntriesByType('navigation')[0];
  // @ts-expect-error Non standard
  return navigationTiming && navigationTiming.serverTiming;
}

export function getTiming(window: Window): PerformanceTiming {
  let timing: PerformanceTiming = {};

  const timeOrigin = window.performance.timeOrigin;
  const navigationTiming = getNavigationTiming(window);
  const performanceTiming = window.performance.timing;

  /**
   * window.performance.timing is deprecated and may cease to work
   * at any time. Let's use the new navigation 2 api and fallback to old.
   */
  if (navigationTiming.length && timeOrigin) {
    timing.navigationStart = Math.floor(timeOrigin);
    const domHighResTimeStamps = navigationTiming[0];

    TIMING_KEYS.forEach((timingKey: string) => {
      let currentTiming = 0;

      if (domHighResTimeStamps[timingKey]) {
        currentTiming = Math.floor(
          timeOrigin + domHighResTimeStamps[timingKey]
        );
      }

      timing[timingKey] = currentTiming;
    });

    // domLoading is not included in new api. It is recommended to not use this.
    // We will update references to this to use domInteractive instead.
    // Old Diagram: https://www.w3.org/TR/navigation-timing/timing-overview.png
    // New Diagram: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/timestamp-diagram.svg
    timing.domLoading = timing.domInteractive;
  } else if (performanceTiming) {
    timing = asDictionary(performanceTiming);
  }

  return timing;
}

function getNetwork(window: Window): NetworkInformationType {
  // @ts-expect-error Non standard, experimental value not available everywhere
  return asDictionary(window.navigator.connection);
}

function getMemory(window: Window): MemoryType {
  // @ts-expect-error Non standard, experimental value not available everywhere
  return asDictionary(window.performance.memory);
}

export function getPaintTimes(window: Window): PaintTimesType {
  let firstPaint = null;
  let firstContentfulPaint = null;
  const paint = window.performance.getEntriesByType('paint');

  if (paint) {
    firstPaint = getTimeFromMarks(paint, 'first-paint');
    firstContentfulPaint = getTimeFromMarks(paint, 'first-contentful-paint');
  } else {
    // @ts-expect-error
    if (typeof window.performance.timing.msFirstPaint === 'number') {
      // IE
      firstPaint =
        // @ts-expect-error
        window.performance.timing.msFirstPaint -
        window.performance.timing.navigationStart;
    } else {
      return null;
    }
  }

  return {
    firstPaint,
    firstContentfulPaint,
  };
}

function getRenderTimes(window: Window): RenderTimesType {
  const marks = window.performance.getEntriesByType('mark');
  const firstRenderStart = getTimeFromMarks(marks, 'firstRenderStart');
  const clientRenderStart = getTimeFromMarks(marks, 'clientRenderStart');
  return {firstRenderStart, clientRenderStart};
}

function getWidth(window: Window) {
  const document = window.document;
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

function getHeight(window: Window) {
  const document = window.document;
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}

function getDeviceDimensions(window: Window): DimensionsType {
  const height = getHeight(window);
  const width = getWidth(window);
  return {height, width};
}

function getNavigationMeta(window: Window): NavigationMetaType {
  return {
    ...getPageData(window),
    time: Date.now(),
  };
}

function getPageData(window: Window) {
  const location = window.location || ({} as Location);

  return {
    hostname: location.hostname,
    pathname: location.pathname,
    referrer: window.document.referrer,
    url: location.href,
    page: location.pathname,
  };
}

const browserPerfCollector = (window: Window): EnhancedMetricsType => {
  if (!hasPerf(window)) {
    return {};
  }

  return {
    navigation: getTiming(window),
    resources: getEntries(window),
    server: getServerTiming(window),
    paintTimes: getPaintTimes(window),
    renderTimes: getRenderTimes(window),
    memory: getMemory(window),
    navigationMeta: getNavigationMeta(window),
    network: getNetwork(window),
    dimensions: getDeviceDimensions(window),
  };
};

function asDictionary(obj: any = {}) {
  if (obj.toJSON && typeof obj.toJSON === 'function') {
    return obj.toJSON();
  }
  return Object.keys(Object.getPrototypeOf(obj)).reduce((result, key) => {
    if (typeof obj[key] !== 'function') {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

export default browserPerfCollector;
