# fusion-plugin-csrf-protection

[![Build status](https://badge.buildkite.com/3fef89529147193838107b8bf6a5e0cb9f1dc8d11502461920.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-csrf-protection)

Provides a modified `fetch` that is automatically secure against CSRF attacks for non-idempotent HTTP methods.

This enhancer handles csrf protection by adding a server side middleware that checks for a valid csrf token on 
requests for non-idempotent HTTP methods (e.g. POST). 
--- 

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`CsrfProtection`](#csrfprotection)
    * [`FetchToken`](#fetchtoken)
  * [Dependencies](#dependencies)
    * [`CsrfIgnoreRoutesToken`](#csrfignoreroutestoken)
  * [Service API](#service-api)
  
---

### Installation

```sh
yarn add fusion-plugin-csrf-protection
```

### Usage

```js
import {createPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';

const pluginUsingFetch = createPlugin({
  deps: {
    fetch: FetchToken,
  },
  provides: ({fetch}) => {
    return {
      getUser: () => {
        return fetch('/get-user');
      }
    }
  },
});
```

### Setup

```js
// src/main.js
import React from 'react';
import {FetchToken} from 'fusion-tokens';
import App from 'fusion-react';
import CsrfProtectionEnhancer, {
  CsrfIgnoreRoutesToken,
} from 'fusion-plugin-csrf-protection';
import fetch from unfetch;

export default () => {
  const app = new App(<div></div>);
  app.register(FetchToken, fetch);
  app.enhance(FetchToken, CsrfProtectionEnhancer);
  // optional
  __NODE__ && app.register(CsrfIgnoreRoutesToken, []);
}
```

### API

#### Registration API 

##### `CsrfProtection`

```js
import CsrfProtection from 'fusion-plugin-csrf-protection';
```

The csrf protection plugin. Typically, it should be registered to the [`FetchToken`](#fetchtoken). Provides the [fetch api](#service-api) and
a server side middleware for validating csrf requests.

##### `FetchToken`

```js
import {FetchToken} from 'fusion-tokens';
```
The canonical token for an implementation of `fetch`. This plugin is generally registered on that token. 
For more, see [the fusion-tokens repo](https://github.com/fusionjs/fusion-tokens#fetchtoken).

#### Dependencies

##### `CsrfIgnoreRoutesToken`

```js
import {CsrfIgnoreRoutesToken} from 'fusion-plugin-csrf-protection';
```

A list of routes to ignore csrf protection on. This is rarely needed and should be used with caution.

**Types**

```js
type CsrfIgnoreRoutes = Array<string>;
```

**Default value**

Empty array `[]`

#### Service API

```js
const response: Response = fetch('/test', {
  method: 'POST',  
})
```

`fetch: (url: string, options: Object) => Promise` - Client-only. A decorated `fetch` function that automatically does pre-flight requests for CSRF tokens if required.

See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API for more on the fetch api.