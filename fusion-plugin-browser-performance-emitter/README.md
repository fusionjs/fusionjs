# fusion-plugin-browser-performance-emitter

[![Build status](https://badge.buildkite.com/a7317a979159381e5e4ffb14e1ccd0d39737fd159f73863915.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-browser-performance-emitter)

The plugin emits events of performance stats from the browser on initial page loads - with the following API when avaliable:
(see https://developer.mozilla.org/en-US/docs/Web/API/Window/performance)
+ [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
[`Navigation Timing Processing Model`](https://www.w3.org/TR/navigation-timing/#processing-model)
![Navigation Timing Processing Model](https://www.w3.org/TR/navigation-timing/timing-overview.png)
+ [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)
[`Resource Timing Processing Model`](https://w3c.github.io/resource-timing/#processing-model)
![Resource Timing Processing Model](https://w3c.github.io/resource-timing/timestamp-diagram.svg)

On the server-side, it calculate performance opinionate metrics from the stats emitted from the browser, then re-emits a new event. Refer to [**Events**](#events) section for a list of events emitted.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`BrowserPerformanceEmitter`](#browserperformanceemitter)
  * [Dependencies](#dependencies)
    * [`UniversalEventsToken`](#universaleventstoken)
  * [Service API](#service-api)
* [Events](#events)
  * [Events emitted](#events-emitted)

---

### Installation

```sh
yarn add fusion-plugin-browser-performance-emitter
```

---

### Usage

To consume the calculated stats, listen to `browser-performance-emitter:stats` event on the server-side.

```js
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

export default createPlugin({
  deps: { emitter: UniversalEventsToken },
  provides: deps => {
    const emitter = deps.emitter;
    emitter.on('browser-performance-emitter:stats', e => {
      console.log(e); // log events to console
    });
  }
});
```

---

### Setup

```js
// src/main.js
import App from 'fusion-react';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import BrowserPerformanceEmitter from 'fusion-plugin-browser-performance-emitter';

import PerformanceLogging from './performance-logging';

export default () => {
  const app = new App();
  // ...
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(BrowserPerformanceEmitter);

  // (optional) a plugin to consume browser performance events
  app.register(PerformanceLogging);
  // ...
  return app;
}
```

---

### API

#### Registration API

##### `BrowserPerformanceEmitter`

```js
import BrowserPerformanceEmitter from 'fusion-plugin-browser-performance-emitter';
```

The browser performance emitter plugin. Typically, it doesn't need to be associated with a [token](https://github.com/fusionjs/fusion-core#token).

#### Dependencies

##### `UniversalEventsToken`

```js
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';

app.register(UniversalEventsToken, UniversalEvents);
```

An event emitter plugin to emit stats to, such as the one provided by [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusion-plugin-universal-events).

#### Service API

This package has no public API methods. To consume performance events, add an event listener for the `browser-performance-emitter:stats` event on the server-side.

---

### Events

#### Events emitted

##### `browser-performance-emitter:stats`

```js
{
  calculatedStats: {
    // Metrics
  },
  timingValues: {
    // "Raw" timing values from `window.performance.timing`
  },
  resourceEntries: {
    // An array of serialized Resource Timing entries
  }
}
```

###### calculatedStats

| name                                | calculation                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| `redirection_time`                  | `fetchStart` - `navigationStart`                             |
| `time_to_first_byte`                | `responseStart` - `navigationStart`                          |
| `dom_content_loaded`                | `domContentLoadedEventEnd` - `fetchStart`                    |
| `full_page_load`                    | `loadEventEnd` - `fetchStart`                                |
| `dns`                               | `domainLookupEnd` - `domainLookupStart`                      |
| `tcp_connection_time`               | `connectEnd` - `connectStart`                                |
| `browser_request_time`              | `responseEnd` - `responseStart`                              |
| `browser_request_first_byte`        | `responseStart` - `requestStart`                             |
| `browser_request_response_time`     | `responseEnd` - `responseStart`                              |
| `dom_interactive_time`              | `domInteractive` - `responseEnd`                             |
| `total_resource_load_time`          | `loadEventStart` - `responseEnd`                             |
| `total_blocking_resource_load_time` | `domContentLoadedEventStart` - `responseEnd`                 |
| `resources_avg_load_time`           | One metric per resource type (e.g. CSS/JS/Image) that represents the mean time for resources of that type to be loaded. Example: `{js: 154, image: 405}` |

###### timingValues

see https://www.w3.org/TR/navigation-timing/#sec-navigation-timing-interface for a complete list of properties

###### resourceEntries

see https://w3c.github.io/resource-timing/#sec-performanceresourcetiming for a complete list of properties

```js
[
  {
    name: 'http://localhost:3000/_static/client-main.js',
    entryType: 'resource',
    // ...other resource timing properties
  },
  // more entries
]
```

