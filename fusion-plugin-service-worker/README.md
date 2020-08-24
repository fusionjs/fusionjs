# fusion-plugin-service-worker

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

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
import {getHandlers} from 'fusion-plugin-service-worker';
import type {AssetInfo} from 'fusion-plugin-service-worker';

export default (assetInfo) => {
  const {onFetch, onInstall, onActivate} = getHandlers(assetInfo);
  self.addEventListener("install", onInstall);
  self.addEventListener('activate', onActivate);
  self.addEventListener("fetch", onFetch);
}
```

### Custom Service Worker

Customize the ServiceWorker by editing `src/sw.js` in your app. It shares the same transpile logic as regular fusion bundles.

### Setup

```js
// src/main.js
import App from 'fusion-react';

import {swTemplate as swTemplateFunction} from 'fusion-cli/sw';
import SwPlugin, {SWTemplateFunctionToken, SWRegisterToken} from 'fusion-plugin-service-worker';

app.register(SwPlugin);
if (__BROWSER__) {
  // optional (default true).
  // If false will unregister existing service workers and clear cache
  app.register(SWRegisterToken, true);
}
if (__NODE__) {
  app.register(SWTemplateFunctionToken, swTemplateFunction);
}
```

The browser will automatically register the service worker on page load.

## Options

The SWOptionsToken  (__NODE__ only) accepts an object with several optional configuration properties:

```ts
type Options = {
  cacheableRoutePatterns?: Array<RegExp>, // default null
  cacheBustingPatterns?: Array<RegExp>, // default null
  cacheDuration?: number, // default 24 hours
};
```

#### cacheableRoutePatterns `Array<RegExp>`
If this option is supplied the Service Worker will only cache HTML responses from requests whose URL matches at least one of these regular expressions. If the `cacheableRoutePatterns` is not supplied, all HTML content will be cached.

```js
  app.register(SWOptionsToken, {
    cacheableRoutePatterns: [/\/airports$/],
  });
```

#### cacheBustingPatterns `Array<RegExp>`
If this option is supplied the Service Worker will empty its cache when it encounters a request (for HTML or other resource) which matches at least one of these regular expressions.

```js
  app.register(SWOptionsToken, {
    cacheBustingPatterns: [/\?logout=true/, /\/display-error/],
  });
```

#### cacheDuration `number`
By deafult html caches expire after 24 hours. This expiry period can be overwrriten via this option. See also [Cache Expiry](#Cache).

```js
  app.register(SWOptionsToken, {
    cacheDuration: 60*60*1000, // one hour
  });
```

## Cache Expiry

Because Service Workers typically cache the HTML there is a possibility that an error or unexpected response will lead to apps being perpetually stuck behind a cache wall and cut off from the network. The Service Worker plugin includes several safeguards that significantly reduce this probability. These include deleting all caches when an HTML request returns a non-200 or non HTML response and backgraound-refreshing the cache from the network after every fetch.

As a last-resort protection, we assign a built-in expiry time to html caches. By default this is 24 hours, but you can override via the `SWOptionsToken` token (see [cacheDuration option](#cacheDuration) above). This is recommended when shipping a Service Worker for the first time, so as to prevent network isolation until the app owner is confident the Service Worker Plugin is working as expected.

## Messaging

The Service Worker sends status updates to the browser client in the form of postMessages.
These messages take the form:

```ts
{
  type: string,
  text: string
}
```

Your app can listen to these post messages and filter by type:

```js
if ('serviceWorker' in window.navigator) {
  window.navigator.serviceWorker.addEventListener('message', event => {
    if (existingSW && event.data.type === 'upgrade-available') {
      // prompt user to reload for new build
      logger.log(event.data.text);
    }
  });
}
```

Message types include: \
**upgrade-available:** A new build has occured and the user should reload the page to get the latest version. The service worker plugin will `console.log` this message by default

**cache-expired:** The Service Worker cache wan not been updated for a period exceeding the cache expiry period (see above) and so has been auto-refreshed.


## Unregistering the Service Worker

If you need all users to unregister the Service Worker, you can register `SWRegisterToken` with the value `false`

```
if (__BROWSER__) {
  app.register(SWRegisterToken, false);
}
```

## Service Worker Plugin Guide

For more information on how to use the Fusion Service Worker Plugin and an explanation of Service Workers in general, please see the [Service Workers section in the Fusion.js Guide](https://fusionjs.com/docs/recipes/service-workers)
