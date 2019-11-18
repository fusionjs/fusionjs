# fusion-plugin-error-handling

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Collects browser errors, server request errors, and uncaught exceptions, and provides an API for consuming them.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`ErrorHandling`](#errorhandling)
  * [Dependencies](#dependencies)
    * [`ErrorHandlingToken`](#errorhandlingtoken)

---

### Installation

```sh
yarn add fusion-plugin-error-handling
```

---

### Usage

```js
// src/monitoring.js
import {createPlugin} from 'fusion-core';

export default __NODE__ && createPlugin({
  provides() {
    return (e, captureType) => {
        if (captureType === 'browser') {
          const {message, source, line, col, error} = e;
          console.log({message, source, line, col, error});
        } else if (captureType === 'server') {
          console.log('UNCAUGHT EXCEPTION', e);
        } else if (captureType === 'request') {
          console.log('REQUEST ERROR');
        }
      }
    }
  }
});
```

Normally, instead of using `console`, you would consume errors via something like [Kafka](https://kafka.apache.org/) or at least use a production logger (such as [`fusion-plugin-universal-logger`](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-logger)) in conjunction with a logging service such as LogEntries or Papertrail.

---

### Setup

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import ErrorHandling, {ErrorHandlerToken} from 'fusion-plugin-error-handling';
import log from './monitoring';

export default () => {
  const app = new App(<div />);
  if (__NODE__) {
    app.register(ErrorHandlerToken, log);
    app.register(ErrorHandling);
  }
  return app;
};
```

---

### API

#### Registration API

##### `ErrorHandling`

```js
import ErrorHandling from 'fusion-plugin-error-handling';
```

The plugin. Typically doesn't need to be associated with a [token](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#token).

#### Dependencies

##### `ErrorHandlerToken`

```js
import {ErrorHandlerToken} from 'fusion-plugin-error-handling';
```

A function to be called when an error is reported.

###### Types

```flow
type ErrorHandler = (e: Error, captureType: string) => Promise
```

If the error is a global uncaught exception or unhandled rejection, the process exits when the returned Promise resolves/rejects.

* `e: Error` - The error that was reported
* `captureType: string` - Either 'browser', 'uncaught' or 'request'.
* returns `Promise`
