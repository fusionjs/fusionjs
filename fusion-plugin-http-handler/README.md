# fusion-plugin-http-handler

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

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