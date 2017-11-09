# fusion-plugin-universal-logger

[![Build status](https://badge.buildkite.com/b2263b681b25bfe410fdf3ba640e682491c77bd61b4f0e63c9.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-universal-logger)

A logger utility that batches logs from the browser to the server at set intervals.

Uses [winston](https://github.com/winstonjs/winston) on the server and exposes the same API on the client.

Depends on [`fusion-plugin-universal-events`](../fusion-plugin-universal-events).

---

### Installation

```sh
yarn add fusion-plugin-universal-logger
```

---

### Example

```js
import App from 'fusion-core';
import UniversalEvents from 'fusion-plugin-universal-events';
import UniversalLogger from 'fusion-plugin-universal-logger';

export default () => {
  const app = new App(<div>Hello</div>);
  const Logger = app.plugin(UniversalLogger, {
    UniversalEvents: app.plugin(UniversalEvents)
  });

  if (__BROWSER__) {
    // log memory usage every minute
    setInterval(() => {
      const logger = Logger.of();
      logger.info('memory consumption is: ' + performance.memory.usedJSHeapSize);
    }, 60000);
  }

  return app;
}
```

### Configuring Winston

```js
const config = __NODE__ && {
  transports: [
    new winston.transports.File({filename: 'logs.log'}),
  ],
};
const Logger = app.plugin(UniversalLogger, {UniversalEvents, config});
```

---

### API

```js
const Logger = app.plugin(UniversalLogger, {UniversalEvents});
```

- `UniversalEvents` - Required. A [`fusion-plugin-universal-events`](../fusion-plugin-universal-events) plugin.
- `Logger` - A Winston logger instance
