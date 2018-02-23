# node-performance-emitter

[![Build status](https://badge.buildkite.com/cd218d02957b19e9397231aea7fe019ea61f5e50225d7a47a8.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-node-performance-emitter)

A tool for collecting, aggregating, and emitting Node.js performance stats.

Collects stats on the event loop lag, garbage collection events, and memory statistics.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`NodePerformanceEmitter`](#nodeperformanceemitter)
    * [`NodePerformanceEmitterToken`](#nodeperformanceemittertoken)
  * [Dependencies](#dependencies)
    * [`UniversalEventsToken`](#universaleventstoken)
    * [`TimersToken`](#timerstoken)
    * [`EventLoopLagIntervalToken`](#eventlooplagintervaltoken)
    * [`SocketIntervalToken`](#socketintervaltoken)
  * [Events](#events)

---

### Installation

```
yarn add fusion-plugin-node-performance-emitter
```

---

### Usage

```js
// src/performance-logging.js
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

export default createPlugin({
  deps: { emitter: UniversalEventsToken },
  provides: deps => {
    const emitter = deps.emitter;
    emitter.on('node-performance-emitter:{action}', e => {
      console.log(e); // log events to console
    });
  }
});
```

---

### Setup

```js
// src/main.js
import App from 'fusion-core';
import NodePerformanceEmitter, {
  NodePerformanceEmitterToken,
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken
} from 'fusion-plugin-node-performance-emitter';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';

export default function() {
  const app = new App(...);

  app.register(UniversalEventsToken, UniversalEvents);
  if (__NODE__) {
    app.register(TimersToken, {setInterval, clearInterval}); // optional
    app.register(EventLoopLagIntervalToken, 10000); // optional
    app.register(MemoryIntervalToken, 10000); // optional
    app.register(SocketIntervalToken, 10000); // optional
    app.register(NodePerformanceEmitterToken, NodePerformanceEmitter);
  }

return app;
}
```

---

### API

#### Registration API

##### `NodePerformanceEmitter`

```js
import NodePerformanceEmitter from 'fusion-plugin-node-performance-emitter';
```

The plugin. Should typically be registered to [`NodePerformanceEmitterToken`](#nodeperformanceemittertoken).

##### `NodePerformanceEmitterToken`

```js
import {NodePerformanceEmitterToken} from 'fusion-plugin-node-performance-emitter';
```

Typically should be registered with [`NodePerformanceEmitter`](NodePerformanceEmitter)

#### Dependencies

##### `UniversalEventsToken`

Required. See [https://github.com/fusionjs/fusion-plugin-universal-events](https://github.com/fusionjs/fusion-plugin-universal-events)

##### `TimersToken`

```js
import {TimersToken} from 'fusion-plugin-node-performance-emitter';
```

Optional. Server-only. Register a `setInterval`/`clearInterval` implementation. Defaults to the global timer functions. Useful for testing.

##### Types

```js
type Timers = {
  setInterval: (Function, number) => number,
  clearInterval: (number) => void,
}
```

##### `EventLoopLagIntervalToken`

```js
import {EventLoopLagIntervalToken} from 'fusion-plugin-node-performance-emitter';
```

Optional. Server-only. The interval between event loop lag measurements. Defaults to `10000`.

##### `MemoryIntervalToken`

```js
import {MemoryIntervalToken} from 'fusion-plugin-node-performance-emitter';
```

Optional. Server-only. The interval between memory measurements. Defaults to `10000`.

##### `SocketIntervalToken`

```js
import {SocketIntervalToken} from 'fusion-plugin-node-performance-emitter';
```

Optional. Server-only. The interval between event socket usage measurements. Defaults to `10000`.

#### Events

This package has no public API methods. To consume performance events, add an event listener for one of the following events:

- `node-performance-emitter:gauge:event_loop_lag`
- `node-performance-emitter:gauge:rss`- process.memoryUsage().rss
- `node-performance-emitter:gauge:externalMemory` - process.memoryUsage().external
- `node-performance-emitter:gauge:heapTotal` - process.memoryUsage().heapTotal
- `node-performance-emitter:gauge:heapUsed` - process.memoryUsage().heapUsed
- `node-performance-emitter:timing:gc` - time spent doing garbage collection
- `node-performance-emitter:gauge:globalAgentSockets` - http.globalAgent.sockets
- `node-performance-emitter:gauge:globalAgentRequests`- http.globalAgent.requests
- `node-performance-emitter:gauge:globalAgentFreeSockets`- http.globalAgent.freeSockets
