# fusion-plugin-http-handler

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Provides a way to hook http handlers into the fusion request lifecycle.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)

---

### Installation

```
yarn add fusion-plugin-http-handler
```

---

### Usage

```js
import HttpHandlerPlugin, {HttpHandlerToken} from 'fusion-plugin-http-handler';
import App from 'fusion-react';
import express from 'express';

const expressApp = __NODE__ && express();
if (__NODE__) {
  expressApp.get('/test', (req, res) => {
    res.end('OK');
  });
}

export default function main() {
  const app = new App(<div>Hello world</div>);
  if (__NODE__) {
    app.register(HttpHandlerPlugin);
    app.register(HttpHandlerToken, expressApp);
  }
  return app;
}
```

### Configuration

You can configure whether to run the middleware before or after await next. The default is running after await next.

```js
import {HttpHandlerConfigToken} from 'fusion-plugin-http-handler';

// Configure to run before await next
if (__NODE__) {
  app.register(HttpHandlerConfigToken, {defer: false});
}
```
