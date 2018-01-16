# fusion-plugin-universal-logger

[![Build status](https://badge.buildkite.com/b2263b681b25bfe410fdf3ba640e682491c77bd61b4f0e63c9.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-universal-logger)

A logger utility that batches logs from the browser to the server at set intervals.

Uses [winston](https://github.com/winstonjs/winston) on the server and exposes the same API on the client.

Depends on [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusion-plugin-universal-events).

---

### Installation

```sh
yarn add fusion-plugin-universal-logger
```

---

### Example

```js
import App from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
import UniversalEvents from 'fusion-plugin-universal-events';
import UniversalLogger from 'fusion-plugin-universal-logger';

export default () => {
  const app = new App(<div>Hello</div>);

  app.register(UniversalUniversalEventsToken, UniversalEvents)
  app.register(LoggerToken, UniversalLogger);

  if (__BROWSER__) {
    // log browser memory usage every minute
    app.register(withDependencies({logger: LoggerToken})(({logger}) => {
      setInterval(() => {
        logger.info('memory consumption is: ' + performance.memory.usedJSHeapSize);
      }, 60000);
    }));
  }

  return app;
}
```

### Configuring Winston

```js
import {UniversalLoggerConfigToken} from 'fusion-plugin-universal-logger';

const config = __NODE__ && {
  transports: [
    new winston.transports.File({filename: 'logs.log'}),
  ],
};
app.configure(UniversalLoggerConfigToken, config);
```

---

### API


#### Dependency registration

```js
import UniversalLogger, {UniversalLoggerToken} from 'fusion-plugin-universal-logger';
import UniversalEvents from 'fusion-plugin-universal-events';

app.register(UniversalLoggerToken, UniversalLogger);
app.register(UniversalEventsToken, UniversalEvents);
app.configure(UniversalLoggerConfigToken, config);
```

- `UniversalLogger` - the logger implementation
- `UniversalEvents` - an universal event emitter. Used internally to upload logs from the browser to the server
- `config` - a Winston config object

#### Instance methods

`logger.log(level, ...args)`

- `level: string` - Valid levels: `'trace'`, `'debug'`, `'info'`, `'access'`, `'warn'`, `'error'`, `'fatal'`
- `args: [string]`

`logger.trace(...args)`

- `args: [string]`

`logger.debug(...args)`

- `args: [string]`

`logger.info(...args)`

- `args: [string]`

`logger.access(...args)`

- `args: [string]`

`logger.warn(...args)`

- `args: [string]`

`logger.error(...args)`

- `args: [string]`

`logger.fatal(...args)`

- `args: [string]`
