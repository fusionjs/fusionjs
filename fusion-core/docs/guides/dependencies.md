# Dependencies

The FusionJS plugin architecture allows plugins to explicitly depend on other service plugins. This allows us to swap implementations of various subsystems, for example for testing, or to provide extended functionality.

A [service plugin](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-a-plugin.md#services) is a plugin that contains a service that exposes a programmatic API. The benefit of encapsulating a service into a plugin is that a plugin allows the service instance to be memoized on a per-request basis without polluting the middleware context, and the plugin can also encapsulate the colocation of all code needed to implement related [endpoints](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-endpoints.md), [providers](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-providers.md) and [HTML template modifications](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/modifying-html-template.md).

Let's see how we can depend on a service that gets instantiated per request:

```js
// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt-session';

export default () => {
  const app = new App()
  const Session = app.plugin(JWTSession);
}
```

Rather than blindly instantiating the service in the `JWTSession` plugin on every single request, this service can now be instantiated on demand.

Let's use this plugin to create a contrived example:

```js
// src/plugins/name.js
export default ({Session}) => (ctx, next) => {
  if (ctx.query.name) {
    const session = Session.of(ctx);
    session.set('name', ctx.query.name);
    ctx.body = {ok: 1};
  }
  return next();
}

// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt-session';
import Name from './plugins/name'

export default () => {
  const app = new App();
  const Session = app.plugin(JWTSession);
  app.plugin(Name, {Session});
}
```

The `Name` plugin simply saves the value in `?name=[value]` to a cookie session if that querystring value is defined.

Notice that the factory function of the `Name` plugin receives `{Session}` as an argument. This is the same `{Session}` that we passed to `app.plugin(Name, {Session})` and it's [how FusionJS plugins do dependency injection](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/configuring-plugins.md).

We then called `Session.of(ctx)` instead of instantiating the service using the `new` keyword. This ensure that within a single request, we always get the same memoized instance every time we call `Session.of(ctx)`, regardless of which plugin calls it.

To illustrate, let's create another contrived plugin to print the the value of the `name` key from the session store:

```js
// src/plugins/greeting.js
export default ({Session}) => async (ctx, next) => {
  if (ctx.path === '/greet') {
    const session = Session.of(ctx);
    ctx.body = {greeting: 'hello ' + await session.get('name')};
  }
  return next();
}

// src/main.js
import App from 'fusion-react';
import JWTSession from 'fusion-plugin-jwt';
import Name from './plugins/name';
import Greeting from './plugins/greeting';

export default () => {
  const app = new App();
  const Session = app.plugin(JWTSession, {secret: __NODE__ && 'secret'});
  app.plugin(Name, {Session});
  app.plugin(Greeting, {Session});
}
```

Here, the `Name` plugin sets state in an instance of the session service, and the `Greeting` plugin reads the state from the _same_ instance of the session service.

### Plugins are interfaces

Notice that in the example above, once we have the memoized instance of the session service (which the plugin provided to us) we only ever call `session.set` and `session.get`.

This means we can easily mock the `Session` dependency in both `Name` and `Greeting` plugins when unit testing them, and it also means that if we want to use, for example, Redis as a session store, all we need to do is replace `fusion-plugin-jwt-session` with a plugin that uses Redis.
