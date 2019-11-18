# fusion-plugin-connected-react-router

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The `fusion-plugin-connected-react-router` package provides integration points with [connected-react-router](https://github.com/supasate/connected-react-router). It is designed
to be used along side of `fusion-plugin-react-router`.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)

---

### Installation

```sh
yarn add fusion-plugin-connected-react-router connected-react-router
```

---

### Usage

This plugin provides a ReduxEnhancer plugin for integrating connected-react-router into your app.
See [connected-react-router](https://github.com/supasate/connected-react-router) docs for usage.

---

### Setup

```js
// src/main.js
import App from 'fusion-react';
import Router, {RouterToken, RouterProviderToken} from 'fusion-plugin-react-router';
import ConnectedRouterEnhancer from 'fusion-plugin-connected-react-router';
import {EnhancerToken} from 'fusion-plugin-react-redux';
import {ConnectedRouter} from 'connected-react-router';
import root from './components/root';

export default function start(App) {
  const app = new App(root);
  // Make sure you register `fusion-plugin-react-router` on the `RouterToken`
  app.register(RouterToken, Router);
  // Register the connected router enhancer on the redux EnhancerToken
  app.register(EnhancerToken, ConnectedRouterEnhancer);
  // Register the ConnectedRouter provider on the RouterProviderToken
  app.register(RouterProviderToken, ConnectedRouter);
  // ... other registrations
  return app;
}
```

If you have other redux enhancers, it may be easier to integrate via a custom plugin


```js

// src/main.js
import App from 'fusion-react';
import {createPlugin} from 'fusion-core';
import Router, {RouterToken, RouterProviderToken} from 'fusion-plugin-react-router';
import ConnectedRouterEnhancer, {ConnectedRouterToken} from 'fusion-plugin-connected-react-router';
import {EnhancerToken} from 'fusion-plugin-react-redux';
import {ConnectedRouter} from 'connected-react-router';
import {compose} from 'redux';
import root from './components/root';

export default function start(App) {
  const app = new App(root);
  // Make sure you register `fusion-plugin-react-router` on the `RouterToken`
  app.register(RouterToken, Router);
  // Register the ConnectedRouter provider on the RouterProviderToken
  app.register(RouterProviderToken, ConnectedRouter);
  // Register the connected router enhancer a token to reference latter
  app.register(ConnectedRouterToken, ConnectedRouterEnhancer);
  // Register a custom plugin that composes all your enhancers
  app.register(EnhancerToken, createPlugin({
    deps: {connectedRouterEnhancer: ConnectedRouterToken},
    provides: ({connectedRouterEnhancer}) => {
      return compose(
        connectedRouterEnhancer,
        // any other custom enhancers...
        myCustomEnhancer
      );
    }
  }));
  // ... other registrations
  return app;
}
```

---

### API

#### Registration API

##### Plugin

```js
import ConnectedRouterPlugin from 'fusion-plugin-connected-react-router';
```

The plugin.

##### `ConnectedRouterToken`

```jsx
import {ConnectedRouterToken} from 'fusion-plugin-connected-react-router';
```

A token for registering the router plugin on. Useful for integrating with other redux enhancers.

