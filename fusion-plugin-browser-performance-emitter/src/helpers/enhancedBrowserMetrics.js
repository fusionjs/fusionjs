/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function hasPerf(window) {
  return Boolean(
    window &&
      window.performance &&
      window.performance.timing &&
      window.performance.getEntriesByType
  );
}

function getEntries(window) {
  const resources = window.performance.getEntriesByType('resource');
  const jsonResources = resources.filter(entry => {
    return entry.name.indexOf('data:') !== 0 && entry.toJSON;
  });
  return jsonResources.map(entry => entry.toJSON());
}

function getServerTiming(window) {
  const navigationTiming = window.performance.getEntriesByType('navigation')[0];
  return navigationTiming && navigationTiming.serverTiming;
}

function getTiming(window) {
  return asDictionary(window.performance.timing);
}

function getNetwork(window) {
  return asDictionary(window.navigator.connection);
}

function getMemory(window) {
  return asDictionary(window.performance.memory);
}

function getFirstPaint(window) {
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

function getWidth(window) {
  const document = window.document;
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

function getHeight(window) {
  const document = window.document;
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}

function getDeviceDimensions(window) {
  const height = getHeight(window);
  const width = getWidth(window);
  return {height, width};
}

const browserPerfCollector: (window: any) => Object = (window: any) => {
  if (!hasPerf(window)) {
    return {};
  }

  return {
    navigation: getTiming(window),
    resources: getEntries(window),
    server: getServerTiming(window),
    firstPaint: getFirstPaint(window),
    memory: getMemory(window),
    network: getNetwork(window),
    dimensions: getDeviceDimensions(window),
  };
};

function asDictionary(obj = {}) {
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
