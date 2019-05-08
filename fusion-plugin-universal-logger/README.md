# fusion-plugin-universal-logger

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

A logger plugin that can handle logging both server side and client side. On the server it uses [winston](https://github.com/winstonjs/winston) directly. On the client, it batches logs and sends them via network to the server at set intervals.

Depends on [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events).

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`UniversalLogger`](#UniversalLogger)
    * [`LoggerToken`](#loggertoken)
  * [Dependencies](#dependencies)
    * [`UniversalEventsToken`](#universaleventstoken)
    * [`UniversalLoggerConfigToken`](#universalloggerconfigtoken)
  * [Service API](#service-api)

### Installation

```sh
yarn add fusion-plugin-universal-logger
```

---

### Usage

```js
import {LoggerToken} from 'fusion-tokens';
// ...
app.middleware({logger: LoggerToken}, ({logger}) => {
  return (ctx, next) => {
    if (__NODE__) logger.info(`Received request at ${ctx.url}`);
    else logger.info(`Pageload at ${ctx.url}`);
    return next();
  };
});
```

### Setup

```js
import App from 'fusion-core';
import winston from 'winston';
import UniversalEvents from 'fusion-plugin-universal-events';
import UniversalLogger, {
  UniversalLoggerConfigToken,
} from 'fusion-plugin-universal-logger';

export default () => {
  const app = new App(<div>Hello</div>);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(LoggerToken, UniversalLogger);
  if (__NODE__) {
    // optional winston configuration
    const config = {
      transports: [new winston.transports.File({filename: 'logs.log'})],
    };
    app.register(UniversalLoggerConfigToken, config);
  }
  return app;
};
```

---

### API

#### Registration API

##### `UniversalLogger`

```js
import UniversalLogger from 'fusion-plugin-universal-logger';
```

The universal logger plugin. Typically it should be registered to the [`LoggerToken`](#loggertoken). Provides the [logger service api](#service-api)

##### `LoggerToken`

```js
import {LoggerToken} from 'fusion-tokens';
```

`fusion-plugin-universal-logger` conforms to the standard logger api designated by the `LoggerToken` from the `fusion-tokens` library, and is most commonly registered with this token.

#### Dependencies

##### `UniversalEventsToken`

```js
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
```

An event emitter plugin, such as the one provided by [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events). Required.

##### `UniversalLoggerConfigToken`

```js
import {UniversalLoggerConfigToken} from 'fusion-plugin-universal-logger';
```

A [Winston](https://github.com/winstonjs/winston) configuration object. Optional. Server-side only.

#### Service API

```js
logger.log(level, ...args);
```

* `level: string` - Valid levels: `'error'`,`'warn'`,`'info'`,`'verbose'`,`'debug'`,`'silly'`
* `args: [string]`

```js
logger.error(...args);
```

* `args: [string]`

```js
logger.warn(...args);
```

* `args: [string]`

```js
logger.info(...args);
```

* `args: [string]`

```js
logger.verbose(...args);
```

* `args: [string]`

```js
logger.debug(...args);
```

* `args: [string]`

```js
logger.silly(...args);
```

* `args: [string]`
