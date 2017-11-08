# fusion-plugin-jwt

[![Build status](https://badge.buildkite.com/0652871d45303631a598c88e1231073ea80b5dffaea46aa2b4.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-jwt?branch=master)

Session library that uses JSON Web Token and cookies

---

### Installation

```sh
yarn add fusion-plugin-jwt
```

---

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import PageViewCounter from './page-view-counter';

export default () => {
  const app = new App(<div></div>);
  const Session = app.plugin(JWTSession, {secret: __NODE__ && 'secret-key-goes-here'});
  app.plugin(PageViewCounter, {Session});
  return app;
}

// src/page-view-counter.js
import html from 'fusion-core';

export default ({Session}) => (ctx, next) => {
  const session = Session.of(ctx);
  const count = (session.get('count') || 0) + 1;
  session.set('count', count);
  ctx.body.body.push(html`You viewed this page ${count} times`);
  return next();
}
```

---

### API

#### Plugin registration

```js
const Session = app.plugin(JWTSession, {secret});
```

- `secret: string` - Encryption secret for JWTs. Required in server, required to be falsy in client.
- `cookieName: string` - Cookie name. Optional. Defaults to `fusion-sess`
- `expiresIn: number` - Time in seconds until session/cookie expiration. Defaults to `86400` (24 hours)

#### Instance API

```js
const session = Session.of(ctx);
```

##### set

```js
const value = session.set(key, val);
```

- `key: string` - Required
- `val: Object|Array|string|number|boolean` - A serializable value. Required
- `value: any` - Returns `val`

##### get

```js
const value = session.set(key);
```

- `key: string` - Required
- `value: any`

---

### Caveats

Note that there's a storage limit of ~4kb since data is stored in the cookie.
