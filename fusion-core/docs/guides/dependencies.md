# Dependencies

The FusionJS plugin architecture allows plugins to explicitly depend on other service plugins. This allows us to swap implementations of various subsystems, for example for testing, or to provide extended functionality.

A [service plugin](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-a-plugin.md#services) is a plugin that contains a service that exposes a programmatic API. The benefit of encapsulating a service into a plugin is that a plugin allows the service instance to be memoized on a per-request basis without polluting the middleware context, and the plugin can also encapsulate the colocation of all code needed to implement related [endpoints](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-endpoints.md), [providers](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-providers.md) and [HTML template modifications](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/modifying-html-template.md).

Let's see how we can depend on a service that gets instantiated per request:

```js
// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import {SessionToken} from 'fusion-tokens';

import Name from './plugins/name'

export default () => {
  const app = new App();
  app.register(SessionToken, JWTSession);
  app.register(Name);
}

// src/plugins/name.js
import {createPlugin} from 'fusion-core';
import {SessionToken} from 'fusion-tokens';

export default createPlugin({
  deps: {Session: SessionToken},
  middleware({Session}) {
    return (ctx, next) => {
      if (ctx.query.name) {
        const session = Session.from(ctx);
        session.set('name', ctx.query.name);
        ctx.body = {ok: 1};
      }
      return next();
    }
  }
});
```

The `Name` plugin simply saves the value in `?name=[value]` to a cookie session if that querystring value is defined.

Notice that the `middleware` method of the `Name` plugin receives `{Session}` as an argument. This is the same `{Session}` that we passed to `app.register(SessionToken, JWTSession)` and it's [how FusionJS plugins do dependency injection](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-a-plugin.md#configuration).

We then called `Session.from(ctx)`, which is how that plugin creates a memoized instance per request.

Let's create another contrived plugin to print the the value of the `name` key from the session store:

```js
// src/plugins/greeting.js
import {createPlugin} from 'fusion-core';
import {SessionToken} from 'fusion-tokens';

export default createPlugin({
  deps: {Session: SessionToken},
  middleware: ({Session}) => async (ctx, next) => {
    if (ctx.path === '/greet') {
      const session = Session.from(ctx);
      ctx.body = {greeting: 'hello ' + await session.get('name')};
    }
    return next();
  }
});

// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import {SessionToken} from 'fusion-tokens';

import Name from './plugins/name';
import Greeting from './plugins/greeting';

export default () => {
  const app = new App();
  app.register(SessionToken, JWTSession);
  app.register(Name);
  app.register(Greeting);
}
```

Here, the `Name` plugin sets state in an instance of the session service, and the `Greeting` plugin reads the state from the _same_ instance of the session service.

### Plugins are interfaces

Notice that in the example above, once we have the memoized instance of the session service (which the plugin provided to us) we only ever call `session.set` and `session.get`.

This means we can easily mock the `Session` dependency in both `Name` and `Greeting` plugins when unit testing them, and it also means that if we want to use, for example, Redis as a session store, all we need to do is replace `fusion-plugin-jwt` with a plugin that uses Redis.
