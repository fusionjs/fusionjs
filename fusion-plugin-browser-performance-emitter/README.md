# fusion-plugin-browser-performance-emitter

[![Build status](https://badge.buildkite.com/a7317a979159381e5e4ffb14e1ccd0d39737fd159f73863915.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-browser-performance-emitter)

Emit performance stats from the browser

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
import UniversalEvents from 'fusion-plugin-universal-events';
import fetch from 'unfetch';
import PerformanceLogging from './performance-logging';

export default () => {
  const app = new App();

  const EventEmitter = app.plugin(UniversalEvents, {fetch});
  app.plugin(BrowserPerformanceEmitterPlugin, {EventEmitter});

  // create a plugin to consume browser perf events
  app.plugin(PerformanceLogging, {EventEmitter});

  return app;
}

// src/performance-logging.js
export default ({EventEmitter}) => {
  const emitter = EventEmitter.of();
  emitter.on('browser-performance-emitter:stats', e => {
    console.log(e); // log events to console
  });
}
```

---

### API

This package has no public API methods. To consume performance events, add an event listener for the `browser-performance-emitter:stats` event.
