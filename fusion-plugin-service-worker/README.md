# fusion-plugin-service-worker

[![Build status](https://badge.buildkite.com/176b20938d88e3b7836a9deb744a94d9e58626679d29b22e0f.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-service-worker)

The Fusion plugin for Service Workers.

Out of the box provides default service worker for basic asset caching. Can be fully customized.

---

## Installation

```sh
yarn add fusion-plugin-service-worker
```

---

## Usage

### Default Service Worker

To use the default service worker, your `src/sw.js` should probably look like this:
(you can take advantage of the `handlers` module to reduce boilerplate)

```js
import {getHandlers} from "fusion-plugin-service-worker";

export default (assetInfo) => {
  const {onFetch, onInstall} = getHandlers(assetInfo);
  self.addEventListener("install", onInstall);
  self.addEventListener("fetch", onFetch);
}
```

### Custom Service Worker

Customize the ServiceWorker by editing `src/sw.js` in your app. It shares the same transpile logic as regular fusion bundles.

---

### Setup
```js
// src/main.js
import App from 'fusion-react';

import {swTemplate as swTemplateFunction} from 'fusion-cli/sw';
import SwPlugin, {SWTemplateFunctionToken} from 'fusion-plugin-service-worker';

app.register(SWTemplateFunctionToken, swTemplateFunction);
app.register(SwPlugin);
if (__NODE__) {
  app.register(SWTemplateFunctionToken, swTemplateFunction);
}
```
Note: SWLoggerToken is an optional browser plugin dep that is not expected to be used outside of tests.

The browser will automatically register the default service worker on page load.
