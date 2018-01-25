/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';

export default createPlugin({
  deps: {emitter: UniversalEventsToken},
  provides: deps => {
    const emitter = deps.emitter;
    emitter.on('browser-performance-emitter:stats:browser-only', (e, ctx) => {
      emitter.emit('browser-performance-emitter:stats', mapPerfEvent(e), ctx);
    });

    /* Helper Functions */
    function mapPerfEvent(event) {
      const {timing, resourceEntries, firstPaint, tags} = event;

      const calculatedStats = getCalculatedStats(
        timing,
        resourceEntries,
        firstPaint
      );

      return {
        ...event.payload,
        calculatedStats,
        timingValues: timing,
        resourceEntries,
        tags,
      };
    }

    function getCalculatedStats(timing, resourceEntries, firstPaint) {
      let calculated = {};
      if (!isEmpty(timing)) {
        calculated = {
          // time spent following redirects
          redirection_time: timing.fetchStart - timing.navigationStart,
          // time from the initial navigation to getting a response from the server
          time_to_first_byte: timing.responseStart - timing.navigationStart,
          // time from the initial request to having all blocking assets loaded
          dom_content_loaded:
            timing.domContentLoadedEventEnd - timing.fetchStart,
          // time from initial request to having all assets (blocking and nonblocking) loaded
          full_page_load: timing.loadEventEnd - timing.fetchStart,
          // dns lookup time
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          // time to open tcp connection
          tcp_connection_time: timing.connectEnd - timing.connectStart,
          // time for browser to get back full html response from server
          browser_request_time: timing.responseEnd - timing.requestStart,
          // time for browser to receive initial response from server
          browser_request_first_byte:
            timing.responseStart - timing.requestStart,
          // time from receiving first byte to receiving full response
          browser_request_response_time:
            timing.responseEnd - timing.responseStart,
          // time to parse the html response into a DOM tree + load blocking resources
          dom_interactive_time: timing.domInteractive - timing.responseEnd,
          // time from having fully parsed html to having all assets loaded
          total_resource_load_time: timing.loadEventStart - timing.responseEnd,
          // time from having fully parsed html to having all blocking assets loaded
          total_blocking_resource_load_time:
            timing.domContentLoadedEventStart - timing.responseEnd,
        };
        if (firstPaint) {
          calculated.first_paint_time = firstPaint;
        }
      }

      if (!isEmpty(resourceEntries)) {
        calculated.resources_avg_load_time = {};
        // all of the values are on the prototype so we need to extract them
        const resourceLoadTimes = resourceEntries.reduce((memo, entry) => {
          const type = extractResourceType(entry.name);
          if (type) {
            if (!memo[type]) {
              memo[type] = [];
            }
            memo[type].push(entry.duration);
          }
          return memo;
        }, {});

        if (!isEmpty(resourceLoadTimes)) {
          Object.keys(resourceLoadTimes).forEach(resourceType => {
            const avgTime = parseInt(mean(resourceLoadTimes[resourceType]), 10);
            calculated.resources_avg_load_time[resourceType] = avgTime;
          });
        }
      }

      return calculated;
    }

    function isEmpty(item) {
      // eslint-disable-next-line no-undefined
      if (item === null || item === undefined) {
        return true;
      }
      if (typeof item === 'object' && Object.keys(item).length === 0) {
        return true;
      }
      if (Array.isArray(item) && item.length === 0) {
        return true;
      }
      return false;
    }

    function extractResourceType(name) {
      const type = name.substring(name.lastIndexOf('.') + 1);

      if (type.indexOf('css') === 0) {
        return 'css';
      } else if (type.indexOf('js') === 0) {
        return 'js';
      } else if (
        type.indexOf('png') === 0 ||
        type.indexOf('svg') === 0 ||
        type.indexOf('jpg') === 0
      ) {
        return 'image';
      }
      return null;
    }

    function mean(array) {
      return (
        array.reduce((total, element) => {
          total += element;
          return total;
        }, 0) / array.length
      );
    }
  },
});
