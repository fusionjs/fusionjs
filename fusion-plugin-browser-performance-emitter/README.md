# fusion-plugin-browser-performance-emitter

[![Build status](https://badge.buildkite.com/a7317a979159381e5e4ffb14e1ccd0d39737fd159f73863915.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-browser-performance-emitter)

Emit performance stats from the browser.

Depends on [fusion-plugin-universal-events](https://github.com/fusionjs/fusion-plugin-universal-events).

---

### Installation

```sh
yarn add fusion-plugin-browser-performance-emitter
```

---

### Example

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

// src/performance-logging.js
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

### API

This package has no public API methods. To consume performance events, add an event listener for the `browser-performance-emitter:stats` event.
