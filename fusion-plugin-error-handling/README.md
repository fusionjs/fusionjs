# fusion-plugin-error-handling

[![Build status](https://badge.buildkite.com/1a76dbe95f76cd888a286290c365fabd54fcc62edb3895aa5d.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-error-handling)

Collects browser errors, server request errors, and uncaught exceptions, and provides an api for handling them.

### Installation

```sh
yarn add fusion-plugin-error-handling
```

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Monitoring from './monitoring';

export default () => {
  const app = new App(<div></div>);
  app.plugin(Monitoring);
  return app;
}

// src/monitoring.js
import ErrorHandling from 'fusion-plugin-error-handling';

export default ({}) => {
  if (__NODE__) {
    const log = (e, type) => {
      if (type === 'browser') {
        const {message, source, line, col, error} = e;
        console.log({message, source, line, col, error});
      } else if (type === 'server') {
        console.log('UNCAUGHT EXCEPTION', e);
      } else if (type === 'request') {
        console.log('REQUEST ERROR', type);
      }
    }
    return ErrorHandling({onError: log});
  }
}
```

### API

`ErrorHandling({onError, CsrfProtection})`

- `onError: (e: Error, type: 'browser' | 'uncaught' | 'request') => Promise` - Required. A function that gets called on server errors. If the error is a global uncaught exception or unhandled rejection, the process exits when the returned Promise resolves/rejects.
- `CsrfProtection` - Optional. Pass your [`fusion-plugin-csrf-protection`](https://github.com/fusionjs/fusion-plugin-csrf-protection) plugin to this package if CSRF protection is enabled, in order to allow errors to be logged without needing a CSRF token.
