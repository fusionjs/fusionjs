# node-performance-emitter

[![Build status](https://badge.buildkite.com/cd218d02957b19e9397231aea7fe019ea61f5e50225d7a47a8.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-node-performance-emitter)

A tool for collecting, aggregating, and emitting Node.js performance stats.

Collects stats on the event loop lag, garbage collection events, and memory statistics.  Note that this plugin is server-side only and will throw an error if used browser-side.

---

### Installation

```
yarn add fusion-plugin-node-performance-emitter
```

---

### Example

```js
// src/main.js
import App, {createPlugin} from 'fusion-core';
import NodePerformanceEmitterPlugin, {
  NodePerformanceEmitterToken,
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken
} from 'fusion-plugin-node-performance-emitter';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';

import PerformanceLogging from './performance-logging';

export default function() {
  const app = new App(...);
  // ...
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(TimersToken, /*some timers*/); // optional
  app.register(EventLoopLagIntervalToken, /*config interval*/); // optional
  app.register(MemoryIntervalToken, /*config interval*/); // optional
  app.register(SocketIntervalToken, /*config interval*/); // optional
  __NODE__ && app.register(NodePerformanceEmitterToken, NodePerformanceEmitterPlugin);

  // (optional) a plugin to consume browser performance events
  app.register(PerformanceLogging);
  // ...
  return app;
}

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

### API

This package has no public API methods. To consume performance events, add an event listener for one of hte following events:

- `node-performance-emitter:gauge:event_loop_lag`
- `node-performance-emitter:gauge:rss`- process.memoryUsage().rss
- `node-performance-emitter:gauge:externalMemory` - process.memoryUsage().external
- `node-performance-emitter:gauge:heapTotal` - process.memoryUsage().heapTotal
- `node-performance-emitter:gauge:heapUsed` - process.memoryUsage().heapUsed
- `node-performance-emitter:timing:gc` - time spent doing garbage collection
- `node-performance-emitter:gauge:globalAgentSockets` - http.globalAgent.sockets
- `node-performance-emitter:gauge:globalAgentRequests`- http.globalAgent.requests
- `node-performance-emitter:gauge:globalAgentFreeSockets`- http.globalAgent.freeSockets

#### Dependency registration

- `UniversalEventsToken` - Required. An event emitter plugin to emit stats events to.
- `TimersToken` - Optional. Timers to track interval-based emissions.
- `EventLoopLagIntervalToken: number` - Optional. Stats emission frequency for event loop lag stats. Defaults to 10,000 (ms).
- `MemoryIntervalToken: number` - Optional. Stats emission frequency for memory stats. Defaults to 10,000 (ms).
- `SocketIntervalToken: number` - Optional. Stats emission frequency for socket stats. Defaults to 10,000 (ms).

