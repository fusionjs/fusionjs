# fusion-plugin-http-handler

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
  expressApp.all('/*', (req, res) => {
    // continue the fusion middleware lifecycle
    res.fusionRender();
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