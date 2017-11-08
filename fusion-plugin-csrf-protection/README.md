# fusion-plugin-csrf-protection

[![Build status](https://badge.buildkite.com/3fef89529147193838107b8bf6a5e0cb9f1dc8d11502461920.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-csrf-protection)

Adds CSRF protection to requests that use non-idempotent HTTP methods.

This package provides a modified `fetch` that is automatically secure against CSRF attacks.

If you're making requests to CSRF protected endpoints from React, you should use [fusion-plugin-csrf-protection-react](../fusion-plugin-csrf-protection-react) instead of this package.

---

### Installation

```sh
yarn add fusion-plugin-csrf-protection
```

---

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import CsrfProtection from 'fusion-plugin-csrf-protection';
import Hello from './hello';

export default () => {
  const app = new App(<div></div>);

  const Session = app.plugin(JWTSession, {secret: __NODE__ && 'secret here'});
  const {fetch, ignore} = app.plugin(CsrfProtection, {Session}).of();

  app.plugin(Hello);

  // makes a pre-flight request for CSRF token if required,
  // and prevents POST calls to /api/hello without a valid token
  if (__BROWSER__) fetch('/api/hello', {method: 'POST'}).then(console.log);
}

// src/hello.js
export default () => (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path === '/api/hello') {
    ctx.body = {hello: 'world'};
  }
  return next();
}
```

---

### API

```js
const Service = app.plugin(CsrfProtection, {Session});
```

- `Session` - Required. A Session plugin, such as the one provided by [`fusion-plugin-jwt`](../fusion-plugin-jwt). The Session instance should expose a `get: (key: string) => string` and `set: (key: string, value: string) => string` methods.

#### Instance method

```js
const {fetch, ignore} = app.plugin(CsrfProtection, {Session}).of();
```

- `ignore: (url: string) => void` - Server-only. Disables CSRF protection for `url`
- `fetch: (url: string, options: Object) => Promise` - Client-only. A decorated `fetch` function that automatically does pre-flight requests for CSRF tokens if required.
