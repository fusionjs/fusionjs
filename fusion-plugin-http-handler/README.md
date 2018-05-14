# fusion-plugin-http-handler

[![Build status](https://badge.buildkite.com/14a7cf8799610714c295d2d38333b8cd941dfbf50efec06c03.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-http-handler)

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
