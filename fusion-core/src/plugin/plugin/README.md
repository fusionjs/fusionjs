# Plugin

Fusion plugins can be either [functional](#functional-plugin-api) or [class-based](#class-based-plugin-api). Typically it's recommended that you use functional plugins, unless you need to provide a service that is object-oriented or stateful.

A Fusion plugin normally looks like this:

```js
export default function(dependencies) {
  return async function(ctx, next) {
    // do things before render
    await next();
    // do things after render
  }
}
```

Exporting a function ensures that dependencies can be mocked for tests, if required, and provide self-documentation of the interfaces that any given plugin requires in order to work correctly.

The following example shows a hello world plugin:

```js
export default function(dependencies) {
  return function(ctx, next) {
    ctx.body = 'Hello world';
    return next();
  }
}
```

The examples above are *functional* plugins. It's also possible to create [class-based plugins](#class-based-plugin-api), similar to how it is possible to create functional and class-based components in React.

The return value of a functional plugin is sometimes referred to as a middleware (because they are similar to Koa middlewares). The return value of a class-based plugin is often referred to as a service.

## Functional Plugin API

Plugins work in a similar way to Koa middlewares. In a nutshell, anything that needs to be setup before rendering the virtual DOM should be written at the top of the function, and everything that should run after rendering the virtual DOM should be written after `await next()` (or in the `then` callback of `return next().then(...)`).

On the server, the plugin function runs on every request, and on the client, it runs on page load.

When multiple plugins are registered in an application, all code before `await next()` is guaranteed to run before render,
and all code after `await next()` is guaranteed to run after render.

Code before `await next()` runs in the order that the plugins were registered, but the code after that promise resolution runs in reverse plugin registration order.
The following example demonstrates the order of execution when composing a list of plugins:

```js
[
  (ctx, next) => {
    console.log(1);
    await next();
    console.log(6);
  },
  (ctx, next) => {
    console.log(2);
    await next();
    console.log(5);
  },
  (ctx, next) => {
    console.log(3);
    await next();
    console.log(4);
  },
]
```

### ctx

The `ctx` argument is an object that lives for the duration of a HTTP request. In addition to Koa context properties, it contains the following property that is consumable from plugins:

- `element: React.Element|Preact.Element`

In addition, it also currently exposes protected properties that Fusion uses internally. You should not rely on these properties, as they will ultimately be abstracted away into core plugins.

- `scripts`
- `nonce`
- `prefix`
- `syncChunkIds`
- `preloadChunkIds`

## Class-based Plugin API

Plugins can be implemented with a class. In that case, a plugin looks like this:

```js
import {Plugin} from 'fusion-core';

export default function(dependencies) {
  return new Plugin({
    Service: class Service {/* ... */}
    middleware(ctx, next) {
      /* ... */
    }
  });
}
```

The `Plugin` class has 2 methods called `of` and `middleware`.

### of

`of: (ctx: KoaContext) => A`

The `of` method creates a memoized instance of the plugin. For example:

```js
const Logger = new Plugin({
  Service: class Logger {
    log() {}
  }
});

const logger = Logger.of(); // a global logger
logger.log('hello world');

const perRequestLogger = Logger.of(ctx);

logger === perRequestLogger; // false
Logger.of(ctx1) === Logger.of(ctx1); // true
Logger.of(ctx1) === Logger.of(ctx2); // false
```

This memoization mechanism allows a plugin consumer to implement complex and potentially asynchronous dependency trees with great flexibility.

Typically, you should not override this method.

### middleware

`middleware: (ctx: KoaContext, next: () => Promise) => Promise`

Typically, you would override this method to implement the logic of your plugin. This method behaves the same way a functional plugin does:

```js
function getHello() {
  class Hello extends Plugin {
    static async middleware(ctx, next) {
      // do things before render
      await next();
      // do things after render
    }
  }
}
```

The `ctx` object (in both `middleware` function and in functional plugins) acts as a core interface to the underlying HTTP request, as well as the memoization key for stateful plugins. For example, to consume a `Session` plugin that is instantiated once per HTTP request, you would do this:

```js
export default function({Session}) {
  return (ctx, next) {
    if (req.method === 'GET' && req.url === '/api/user') {
      const session = Session.of(ctx); // get instance of session specific to this request
      const user = await session.get(ctx.query.id)
      ctx.type = 'application/json'
      ctx.body = user; // serve the data
    }
    return next();
  }
}
```

Since `Session.of(ctx)` is memoized per request, you can use it from other plugins without incurring extra instantiation costs. The plugin itself may also choose to memoize its own API calls, if desired.

Note that overriding a `middleware` method is optional. For example, a `Logger` plugin would typically only expose a standalone service and therefore would not need to implement a `middleware` method. The base method is a pass-through middleware (i.e. `(ctx, next) => next()`).

---

## Plugin registration

Plugins are registered via an `App` class. Typically you'll want to use the `App` class provided by the `fusion-react` package.

```js
// src/main.js
import App from 'fusion-react';

export default function() {
  const app = new App();
  app.plugin(Plugin1);
  app.plugin(Plugin2);
  app.plugin(Plugin3);
  app.start();
}
```

This interface allows Fusion to provide seamless HMR in development mode, while also providing flexibility to run code after server start.

---

### App Registration

Plugins may function as standalone global services (e.g. a Logger plugin), but when they are used in HTTP requests or within a React/Preact context, they need to be registered to a Fusion application.

To register a plugin, call `app.plugin()`.

```js
// src/main.js
import App from 'fusion-core';
import HelloWorld from './hello-world';

export default function() {
  const app = new App();
  app.plugin(HelloWorld);
};

// src/hello-world.js
export default function() {
  return new Plugin({
    middleware(ctx, next) {
      ctx.type = 'text/html';
      ctx.body = '<h1>Hello world</h1>';
      return next();
    }
  });
}
```

The example above sets up a server that responds with a `hello world` for all requests.

---

### Middleware semantics

Middlewares represent the lifetime of an HTTP request.

The middleware function runs in two stages, before `await next()` and after. It's your responsibility to call `await next()` appropriately when implementing a `middleware` method.

The code before `await next()` runs before the virtual dom rendering happens, and the code after `await next()` runs after the rendering. In the server, the request is flushed after your middleware method returns.

Typically, you'll want to run all your logic before rendering. In this case, you can simply run `return next()` at the end of your function.

#### Alternatives for async/await

While async/await makes middlewares slightly easier to read, it may be preferrable to avoid using it (for example, if a size increase due to polyfills is unacceptable for a given project).
In that case, one can simply use promises instead:

```js
export default function() {
  return class extends Plugin {
    static middleware(ctx, next) {
      // before render
      return next().then(() => {
        // after render
      });
    }
  }
}
```

Normally, you won't need to do things after render, so your code will simply look like this:

```js
export default function() {
  return class extends Plugin {
    static middleware(ctx, next) {
      // your code here
      return next();
    }
  }
}
```

---

### Typical Usage

Here's how a typical entry point might look like:

```js
// src/main.js
import App from 'fusion-react';
import Root from './components/root';
import Router from 'fusion-plugin-react-router';

export default function() {
  const app = new App(Root);
  app.plugin(Router);
  return app;
}

// src/components/root.js
import React from 'react';
import {Switch, Route} from 'fusion-plugin-react-router';

const Hello = () => <div>Hello</div>;

export default (
  <Switch>
    <Route path="/" component="Hello" />
  </Switch>
);
```

#### Universal plugins

A plugin can be atomically responsible for serialization/deserialization of data from the server to the client.

The example below shows a plugin that grabs the project version from package.json and logs it in the browser:

```js
// src/version-plugin.js
import util from 'util';
import fs from 'fs';
import {html, unescape} from 'fusion-core'; // html sanitization

export default () => {
  if (__NODE__) {
    const read = util.promisify(fs.readFile);

    return (ctx, next) => {
      return read('package.json').then(data => {
        const {version} = JSON.parse(data);
        ctx.body.head.push(html`<meta id="app-version" content="${version}">`);
        return next();
      })
    }
  }
  else {
    return (ctx, next) => {
      const version = unescape(document.getElementById('app-version').content);
      console.log(`Version: ${version}`);
    }
  }
}
```

We can then consume the plugin like this:

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Version from './plugins/version-plugin';

const root = <div>Hello world</div>;

export default function() {
  const app = new App(root);
  app.plugin(Version);
  return app;
}
```

#### Implementing HTTP endpoints

A plugin can be used to implement an HTTP endpoint. To achieve this, simply run code conditionally based on the url of the request

```js
export default () => async (ctx, next) => {
  if (ctx.path === '/api/v1/users') {
    ctx.body = await getUsers();
  }
  return next();
}
```
