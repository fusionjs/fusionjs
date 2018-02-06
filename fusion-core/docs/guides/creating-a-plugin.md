# Creating a FusionJS Plugin

FusionJS provides official plugins for a wide variety of tasks, and it's possible to write complex applications without ever writing a single custom plugin. With that said, it's possible you might find that there's no plugin available for a task you're trying to accomplish, or that you don't agree with the opinions of an existing plugin. This section explains the FusionJS plugin architecture and how to implement various types of plugins.

## FusionJS plugin architecture

Plugins in FusionJS exist to encapsulate all code required to address a logic area of concern, regardless of whether the code runs server-side, in the browser, on a per-request basis, on multiple HTTP endpoints, whether it affects React context, etc.

At the same time, plugins are designed so that dependencies are injectable, and therefore modular and testable.

Examples of areas of concern that a plugin can encapsulate include CSS-in-JS, RPC, CSRF protection, translations, etc.

## Plugin structure

Create a plugin with the `createPlugin`:

```js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  deps: dependencies,
  provides() {
    return service;
  }
  middleware() {
    return middleware;
  }
});
```

The `createPlugin` function accepts three optional named parameters: `deps`, `provides`, and `middleware`.

* `deps: Object` - a map of dependencies
* `provides: (deps: Object) => T` - receives resolved dependencies as named arguments and returns a service
* `middleware: (deps: Object, service: T) => (ctx: FusionContext, next: () => Promise) => Promise` - receives dependencies and the provided service and returns a middleware

---

## Dependency injection

A dependency is anything that has a programmatic API that can be consumed by another part of your web application, and that you might reasonably want to mock in a test.

In FusionJS, dependencies are registered to tokens via `app.register`:

```js
// src/main.js
import App from 'fusion-react';
import {LoggerToken} from 'fusion-tokens';

export default () => {
  const app = new App();

  app.register(LoggerToken, console); // register a logger

  return app;
};
```

Plugins can signal that they depend on something by referencing a token. Let's suppose there's an `Example` plugin that looks like this:

```js
// src/plugins/example.js
import {LoggerToken} from 'fusion-tokens';

export default createPlugin({
  deps: {logger: LoggerToken},
});
```

The code above means that the `Example` plugin depends on whatever `LoggerToken` represents. In other words, the following entry point would throw an error about a missing `LoggerToken` dependency:

```js
// src/main.js
import App from 'fusion-react';
import Example from './plugins/example.js';

export default () => {
  const app = new App();
  app.register(Example);
  return app;
};

// throws 'Cannot resolve to a default value of 'undefined' for token: LoggerToken'
```

The error occurs because we've specified that `LoggerToken` is a dependency of the `Example` plugin, via its `deps` field. To resolve the error, you would then need to register the dependency:

```js
// src/main.js
import App from 'fusion-react';
import {LoggerToken} from 'fusion-tokens';
import Example from './plugins/example.js';

export default () => {
  const app = new App();
  app.register(Example);
  app.register(LoggerToken, console);
  return app;
};

// everything's peachy now
```

Note that nothing depends on `Example`, so we don't need to register it to a token. Later, we'll look into how we can make [the `Example` plugin do something with the logger it depends on](#services-with-dependencies).

Also note that we can register dependencies in any order. In this case, we registered `console` after `Example` even though `Example` depends on `console`.

### Overriding dependencies

One benefit of registering `console` as a dependency is that we can mock it in tests, by simply re-registering something else to the `LoggerToken`.

```js
// src/__tests__/index.js
import test from 'tape-cup';
import createApp from '../main.js';

test('my test', t => {
  const app = createApp();

  // override the logger with a mock
  app.register(LoggerToken, noopLogger);

  // now we can run an end-to-end test without polluting logs

  t.end();
});
```

If we had hard-coded `console` everywhere, it would be difficult to mock it in an integration or e2e test.

---

## Providing services

Plugins can provide a programmatic interface and be registered as dependencies for other plugins via `provides`.

```js
// src/plugins/example.js
import {createToken, LoggerToken} from 'fusion-tokens';

export const ExampleToken = createToken('ExampleToken');

export default createPlugin({
  provides() {
    return {
      sayHello() {
        console.log('hello world');
      },
    };
  },
});
```

The example above exports a plugin that resolves to an object with a `sayHello` method.

It also exports a token called `ExampleToken`, which can be used by other plugins that want to depend on the `Example` plugin.

### Services with dependencies

We can expand the `Example` plugin above to consume the logger that we registered.

```js
// src/plugins/example.js
import {createToken, LoggerToken} from 'fusion-tokens';

export const ExampleToken = createToken('ExampleToken');

export default createPlugin({
  deps: {logger: LoggerToken},
  provides({logger}) {
    return {
      sayHello() {
        logger.log('hello world');
      },
    };
  },
});
```

Similarly, if we wanted to log `"hello world"`, we can create another plugin that depends on the `Example` plugin:

```js
// src/plugins/foo.js
import {createToken} from 'fusion-tokens';
import {ExampleToken} from '';

export const ExampleToken = createToken('ExampleToken');

export default createPlugin({
  deps: {example: ExampleToken},
  provides({example}) {
    example.sayHello();
  },
});
```

And then register the dependencies accordingly:

```js
// src/main.js
import App from 'fusion-react';
import {LoggerToken} from 'fusion-tokens';
import Example, {ExampleToken} from './plugins/example.js';
import Foo from './plugins/foo.js';

export default () => {
  const app = new App();
  app.register(LoggerToken, console);
  app.register(ExampleToken, Example);
  app.register(Foo);
  return app;
};
```

---

## Middlewares

One of the most common use case for creating a plugin for an application is to implement HTTP endpoints.

To do so, a plugin would look like this:

```js
// src/api/hello.js

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      if (ctx.method === 'POST' && ctx.path === '/api/hello') {
        ctx.body = {greeting: 'hello'};
      }
      return next();
    }
  },
}
```

### Middlewares with dependencies

Just like the `provides` method, the `middleware` method can receive dependencis as arguments.

For example, let's say we want to inject a logger:

```js
// src/api/hello.js
import {LoggerToken} from 'fusion-tokens';

export default createPlugin({
  deps: {console: LoggerToken}
  middleware({console}) {
    return (ctx, next) => {
      if (ctx.method === 'POST' && ctx.path === '/api/hello') {
        ctx.body = {greeting: 'hello'};
        console.log('hello');
      }
      return next();
    }
  }
};
```

### Middlewares with services

The `middleware` method also receives the return value of `provides` as its second argument, which allows the middleware to consume the programmatic API that the plugin provides:

```js
// src/plugins/example.js
import {createToken, LoggerToken} from 'fusion-tokens';

export const ExampleToken = createToken('ExampleToken');

export default createPlugin({
  deps: {logger: LoggerToken},
  provides({logger}) {
    return {
      sayHello() {
        logger.log('hello world');
      },
    };
  },
  middleware({logger}, greeter) {
    return (ctx, next) => {
      greeter.sayHello();
      return next();
    };
  },
});
```

### Configuration

Configuration values can be registered to tokens in the same way plugins can:

```js
// src/main.js
import App from 'fusion-react';
import SomePlugin, {ConfigToken} from './plugins/some-plugin.js';

export default () => {
  const app = new App();
  app.register(SomePlugin);
  app.register(ConfigToken, 'hello');
  return app;
};

// src/plugins/some-plugin.js
import {createPlugin} from 'fusion-core';
import {createToken} from 'fusion-tokens';

export const ConfigToken = createToken('ConfigToken');
export default createPlugin({
  deps: {config: ConfigToken},
  provides() {
    return {
      greet() {
        return config; // returns 'hello'
      }
    }
  }
})
```

Both dependencies and configuration need to be specified when the plugin is registered in `src/main.js`.

---

### Request lifecycle

On the server, the middleware function is a [Koa.js](http://koajs.com/) middleware, with a few additional FusionJS-specific properties. A middleware represents the lifecycle of an HTTP request.

On the browser, the middleware function represents the timeline of what happens during page load.

Koa middlewares are functions that receive a `ctx` object and a `next` function as arguments. The `next` function should be called once by the function, and the return value of the function should be a promise.

In a nutshell, The Koa `ctx` object has properties for various HTTP values (`url`, `method`, `headers`, etc), and `next` is an async function that the middleware is responsible for calling.

In FusionJS, the `next()` call represents the time when virtual dom rendering happens. Typically, you'll want to run all your logic before that, and simply have a `return next()` statement at the end of the function. Even in cases where virtual DOM rendering is not applicable, this pattern is still the simplest way to write a middleware.

In a few more advanced cases, however, you might want to do things _after_ virtual dom rendering. In that case, you can call `await next()` instead:

```js
export default createPlugin({
  middleware() {
    return __NODE__ && async (ctx, next) => {
      // this happens before virtual dom rendering
      const start = new Date();

      await next();

      // this happens after virtual rendeing, but before the response is sent to the browser
      console.log('timing: ', new Date() - start);
    }
  }
});
```

##### Troubleshooting hang-ups

**Note**: The `next` function should normally be called once - and only once - per middleware call. We recommend avoiding complex conditional trees to prevent unexpected bugs that could occur when the function inadvertedly gets called multiple times (resulting in an error), or cases where it doesn't get called at all.

It's important to keep in mind that the middleware stack will remain in a pending status if you forget to call `return next()` or will potentially behave erratically if you break the promise chain (for example, by forgetting to use `async/await` or by forgetting to `return` in a non-async function). Breaking the promise chain is useful in a few select obscure cases, for example, short-circuiting the stack when dealing with static assets, but can lead to surprising behavior if done inadvertedly.

If things appear to hang or give you a blank screen, make sure you called `return next()` in your middleware.
