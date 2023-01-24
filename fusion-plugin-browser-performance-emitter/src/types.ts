/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {UniversalEventsToken} from 'fusion-plugin-universal-events';

export type BrowserPerfDepsType = {
  emitter: typeof UniversalEventsToken;
};

// window.performance.timing is deprecated. A few changes were needed to keep the object intact:
// window.performance.timing.navigationStart -> window.performance.originTime
// domLoading is no longer included and should not be used. We can use domInteractive instead.
// We will preserve it in this object but begin updating references of domLoading to domInteractive
// window.performance.timing.domLoading -> window.performance.getEntriesByType('navigation')[0].domInteractive
// The timings are now elapsed time instead of timestamp: Math.floor(window.performance.originTime + eachValue)
// Old Doc: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming
// New Doc: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming
// Old Diagram: https://www.w3.org/TR/navigation-timing/timing-overview.png
// New Diagram: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/timestamp-diagram.svg
export type PerformanceTiming = {
  navigationStart?: number;
  connectStart?: number;
  secureConnectionStart?: number;
  fetchStart?: number;
  domContentLoadedEventStart?: number;
  responseStart?: number;
  domInteractive?: number;
  domainLookupEnd?: number;
  responseEnd?: number;
  redirectStart?: number;
  requestStart?: number;
  unloadEventEnd?: number;
  unloadEventStart?: number;
  domLoading?: number;
  domComplete?: number;
  domainLookupStart?: number;
  loadEventStart?: number;
  domContentLoadedEventEnd?: number;
  loadEventEnd?: number;
  redirectEnd?: number;
  connectEnd?: number;
};

export type BrowserPerfEventType = {
  timing: PerformanceTiming;
  resourceEntries: PerformanceResourceTiming[];
  paintTimes: PaintTimesType;
  enhancedMetrics: EnhancedMetricsType;
  tags: TagsType;
};

export type BrowserPerfEventMappedType = BrowserPerfEventType & {
  calculatedStats: CalculatedStatsType;
  timingValues: PerformanceTiming;
};

export type NetworkInformationType = {
  downLink: number;
  downLinkMax: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  saveData: boolean;
  type:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'none'
    | 'wifi'
    | 'wimax'
    | 'other'
    | 'unknown';
};

export type MemoryType = {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
};

export type ResourcesType = Record<string, any>[];

export type EnhancedMetricsType = {
  app?: AppType;
  navigation?: PerformanceTiming;
  resources?: ResourcesType;
  server?: PerformanceServerTiming;
  paintTimes?: PaintTimesType;
  renderTimes?: RenderTimesType;
  memory?: MemoryType;
  navigationMeta?: NavigationMetaType;
  network?: NetworkInformationType;
  dimensions?: DimensionsType;
};

export type NavigationMetaType = {
  time: number;
  hostname: string;
  pathname: string;
  referrer: string;
  url: string;
  page: string;
};

export type DimensionsType = {
  height: number;
  width: number;
};

export type AppType = {
  perfLoggerVersion?: string;
};

export type TagsType = {route: string};

export type PaintTimesType = {
  firstPaint: number;
  firstContentfulPaint: number;
};

export type RenderTimesType = {
  firstRenderStart: number;
  clientRenderStart: number;
};

export type CalculatedStatsType = {
  redirection_time?: number;
  time_to_first_byte?: number;
  dom_content_loaded?: number;
  full_page_load?: number;
  dns?: number;
  tcp_connection_time?: number;
  browser_request_time?: number;
  browser_request_first_byte?: number;
  browser_request_response_time?: number;
  dom_interactive_time?: number;
  total_resource_load_time?: number;
  total_blocking_resource_load_time?: number;
  first_paint_time?: number;
  first_contentful_paint_time?: number;
  resources_avg_load_time?: Record<string, number>;
};
