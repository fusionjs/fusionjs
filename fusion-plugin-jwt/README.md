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
import JWTSession, {
  SessionSecretToken
  SessionCookieNameToken
  SessionCookieExpiresToken
} from 'fusion-plugin-jwt';

import {SessionToken} from 'fusion-tokens';

// src/main.js
export default () => {
  const app = new App();
  // ...
  if (__NODE__) {
    app.register(SessionToken, JWTSession);
    app.register(SessionSecretToken, 'some-secret'); // required
    app.register(SessionCookieNameToken, 'some-cookie-name'); // required
    app.register(SessionCookieExpiresToken, 86400); // optional

    app.middleware({Session: SessionToken}, ({Session}) => {
      return async (ctx, next) => {
        const session = Session.from(ctx);
        session.set('some-key', 'some-value');
        const someValue = session.get('some-key');
        return next();
      }
    });
  }
  // ...
  return app;
}
```

---

### API

#### Dependency registration

```js
import {
  SessionSecretToken
  SessionCookieNameToken
  SessionCookieExpiresToken
} from 'fusion-plugin-jwt';

__NODE__ && app.register(SessionSecretToken, 'some-secret');
__NODE__ && app.register(SessionCookieNameToken, 'some-cookie-name');
__NODE__ && app.register(SessionCookieExpiresToken, 86400);
```

`fusion-plugin-jwt` conforms to the standard fusion session API token exposed as `{SessionToken}` from `fusion-tokens`.

##### Required dependencies

Name | Type | Description
-|-|-
`SessionSecretToken` | `string` | Encryption secret for JWTs. Required on the server, required to be falsy in client.  Server-side only.
`SessionCookieNameToken` | `string` | Cookie name.  Server-side only.

##### Optional dependencies

Name | Type | Default | Description
-|-|-|-
`SessionCookieExpiresToken` | `number` | `86400` | Time, in seconds, until session/cookie expiration. Defaults to 24 hours.

#### Instance API

```js
app.middleware({Session: SessionToken}, ({Session}) => {
  return async (ctx, next) => {
    const session = Session.from(ctx);
  }
});
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
const value = session.get(key);
```

- `key: string` - Required
- `value: any`

---

### Caveats

Note that there's a storage limit of ~4kb since data is stored in the cookie.
