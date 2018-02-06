# Working with secrets

Handle secrets like any other plugin configuration. Just register them to provide them to the plugin you're using.

In the example below, the secret for the JWT session plugin is being provisioned via environment variables.

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import JWTSession, {SessionSecretToken} from 'fusion-plugin-jwt';
import {SessionToken} from 'fusion-tokens';

export default () => {
  const app = new App(<div>Hello</div>);

  app.register(SessionToken, JWTSession);
  app.register(SessionSecretToken, __NODE__ && process.env.SESSION_SECRET);

  return app;
}
```

Remember that typically we should only expose secrets in the server. In the example above, the `__NODE__ && process.env.SESSION_SECRET` expression [gets removed from the browser bundle](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/universal-code.md) via UglifyJS' dead code elimination.

# Secret rotation

It's good security practice to rotate secrets regularly, but we might not want to restart the application every time rotation needs to happen.

To accomplish dynamic secret rotation, plugins can receive an EventEmitter or similar abstraction as an argument:

```js
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
const {SingletonPlugin} = require('fusion-core');

export default createPlugin({
  deps: {SecretsEmitter: UniversalEventsToken},
  provides: ({SecretsEmitter}) => {
    const service = class Foo {
      //...
    };

    const emitter = SecretsEmitter.from()
    emitter.on('secret-rotation:foo', () => {
      const foo = service.from();
      // apply new secret
    });

    return service;
});
```
