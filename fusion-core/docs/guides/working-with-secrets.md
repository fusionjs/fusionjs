# Working with secrets

Secrets can be handled like any other plugin configuration - just pass them to the plugin you're using.

In the example below, the secret for the JWT session plugin is being provisioned via environment variables.

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt-session';

export default () => {
  const app = new App(<div>Hello</div>);

  const Session = app.plugin(JWTSession, {secret: __NODE__ && process.env.SESSION_SECRET});

  return app;
}
```

Remember that typically we should only expose secrets in the server. In the example above, the `__NODE__ && process.env.SESSION_SECRET` expression [gets removed from the browser bundle](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/universal-code.md) via UglifyJS' dead code elimination.

# Secret rotation

It's good security practice to rotate secrets regularly, but we might not necessarily want to restart the application every time rotation needs to happen.

In order to accomplish dynamic secret rotation, plugins can receive an EventEmitter or similar abstraction as an argument:

```js
const {SingletonPlugin} = require('fusion-core');

export default ({SecretsEmitter}) => {
  const plugin = new SingletonPlugin({
    Service: class Foo {
      //...
    },
  });

  const emitter = SecretsEmitter.of()
  emitter.on('secret-rotation:foo', () => {
    const foo = plugin.of();
    // apply new secret
  });

  return plugin;
};
```
