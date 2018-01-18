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
import JWTSessionfrom, {
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

#### Plugin registration

```js
import {SessionToken} from 'fusion-tokens';
app.register(SessionToken, JWTSession);
```

`fusion-plugin-jwt` conforms to the standard fusion session api token exposed as `{SessionToken}` from 'fusion-tokens`.

#### Dependencies

##### SessionSecretToken

- `string` - Encryption secret for JWTs. Required on the server, required to be falsy in client.

```js
import {SessionSecretToken} from 'fusion-plugin-jwt';
__NODE__ && app.register(SessionSecretToken, 'some-secret'); 
```

##### SessionCookieNameToken

- `string` - Cookie name. Required on the server.

```js
import {SessionCookieNameToken} from 'fusion-plugin-jwt';
__NODE__ && app.register(SessionCookieNameToken, 'some-cookie-name'); 
```

##### SessionCookieExpiresToken

- `number` - Time in seconds until session/cookie expiration. Defaults to `86400` (24 hours)

```js
import {SessionCookieExpiresToken} from 'fusion-plugin-jwt';
__NODE__ && app.register(SessionCookieNameToken, 86400); 
```

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
