# Creating a FusionJS Plugin

There are two common types of plugins: middlewares and services.

A [middleware plugin](#middlewares) specifies how the application should respond to a specific HTTP request.

A [service plugin](#services) exposes a programmatic API that can be used by other plugins.

Complex plugins can be both at the same time.

When writing a plugin you should always export a function that returns either a middleware or a instance of the `Plugin` class.

---

## Middlewares

One of the most common use case for creating a plugin for an application is to implement HTTP endpoints.

To do so, a plugin would typically look like this:

```js
// src/api/hello.js

export default () => (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path === '/api/hello') {
    ctx.body = {greeting: 'hello'};
  }
  return next();
}
```

Let's break this down. Here, we export a _factory_ function that returns a _middleware_ function.

```js
export default () => // this is the factory function
  (ctx, next) => { // this is the middleware function
    if (ctx.method === 'POST' && ctx.path === '/api/hello') {
      ctx.body = {greeting: 'hello'};
    }
    return next();
  }
```

### Dependency management

The factory function can receive dependencies as arguments. This makes it possible mock those dependencies when we want to test the plugin.

For example, let's say we want to inject a logger:

```js
// src/api/hello.js

export default ({console}) => (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path === '/api/hello') {
    ctx.body = {greeting: 'hello'};
    console.log('hello');
  }
  return next();
}
```

Now we can easily swap logger implementations as long as they conform to a common interface, and we can just as easily mock or noop the logger in tests as needed.

### Configuration

Similarly, the factory function can also receive configuration. For example, let's say we want to configure the endpoint url:

```js
// src/api/hello.js

export default ({url = '/api/hello'}) => (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path === url) {
    ctx.body = {greeting: 'hello'};
  }
  return next();
}
```

Both dependencies and configuration need to be specified when the plugin is registered in `src/main.js`.

To register a plugin, call `app.plugin()`. The first argument should be the factory function, and the second argument is an optional map of dependencies that will get passed to the factory function.

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Hello from './api/hello';

export default () => {
  const app = new App(<div>Hello</div>);

  app.plugin(Hello, {url: '/api/hi', console});

  return app;
}
```

### Request lifecycle

On the server, the middleware function is a [Koa.js](http://koajs.com/) middleware, with a few additional FusionJS-specific properties. A middleware represents the lifecycle of an HTTP request.

On the browser, the middleware function represents the timeline of what happens during page load.

Koa middlewares are functions that receive a `ctx` object and a `next` function as arguments. The `next` function should be called once by the function, and the return value of the function should be a promise.

In a nutshell, The Koa `ctx` object has properties for various HTTP values (`url`, `method`, `headers`, etc), and `next` is an async function that the middleware is responsible for calling.

In FusionJS, the `next()` call represents the time when virtual dom rendering happens. Typically, you'll want to run all your logic before that, and simply have a `return next()` statement at the end of the function. Even in cases where virtual DOM rendering is not applicable, this pattern is still the simplest way to write a middleware.

In a few more advanced cases, however, you might want to do things _after_ virtual dom rendering. In that case, you can call `await next()` instead:

```js
export default () => __NODE__ && async (ctx, next) => {
  // this happens before virtual dom rendering
  const start = new Date();

  await next();

  // this happens after virtual rendeing, but before the response is sent to the browser
  console.log('timing: ', new Date() - start);
}
```

##### Troubleshooting hang-ups

Note that the `next` function should normally be called once - and only once - per middleware call. We recommend avoiding complex conditional trees to prevent unexpected bugs that could occur when the function inadvertedly gets called multiple times (resulting in an error), or cases where it doesn't get called at all.

It's important to keep in mind that the middleware stack will remain in a pending status if you forget to call `return next()` or will potentially behave erratically if you break the promise chain (for example, by forgetting to use `async/await` or by forgetting to `return` in a non-async function). Breaking the promise chain is useful in a few select obscure cases, for example, short-circuiting the stack when dealing with static assets, but can lead to surprising behavior if done inadvertedly.

If things appear to hang or give you a blank screen, make sure you called `return next()` in your middleware.

If you need a no-op middleware, you can simply not return a function.

```js
// if we don't need to do anything on page load on the browser,
// we can simply not return a function at all in the client-side
export default () => __NODE__ && () => {/* ... */}
```

---

## Services

Often we want to encapsulate some functionality into a single coherent package that exposes a programmatic API that can be consumed by others.

In FusionJS, any class can be a service. Here's how to wrap a service in a plugin:

```sh
yarn add fusion-core
```

```js
import {Plugin} from 'fusion-core';

export default () => {
  return new Plugin({
    Service: class SomeService {
      /* ... */
    },
  });
}
```

Wrapping a service in a plugin gives consumers a few benefits. One of them is that plugins can memoize instances on a per-request basis, via the `of()` method.

Suppose we have state that is dependent on request data and we want to reuse that state across multiple endpoints and services. We can encapsulate that state in a service:

```js
// src/my-state.js
import {Plugin} from 'fusion-core';

export default () => {
  return new Plugin({
    Service: class MyState {
      constructor(ctx) {
        // Here's some contrived state.
        // A less contrived example might be decrypting a session cookie
        // or parsing the accept-language header instead
        this.url = ctx.url;
      }
    },
  });
}
```

Here's how we can consume this service from other plugins:

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import MyState from './my-state';
import MyApi from './my-api';

export default () => {
  const app = new App(<div>Hello</div>);

  const State = app.plugin(MyState); // returns the plugin

  app.plugin(MyApi, {State});

  return app;
}

// src/my-api.js
export default ({State}) => (ctx, next) => {
  if (ctx.method === 'GET' && ctx.path === '/api/my-state') {
    ctx.body = State.of(ctx).url; // get the instance of MyState
  }
}
```

Since `ctx` is the always the same during the lifetime of a request, every time `State.of(ctx)` is called from the same request, it returns the same instance of the `MyState` class. Naturally, calling it from a different request returns a different instance that is unique to the other request.

The benefit of encapsulating state into a service rather than polluting `ctx` with ad-hoc properties is that an application can scale to any complexity without running into the risk of `ctx` properties getting clobbered by unrelated plugins due to issues like naming collisions.

Encapsulated services are also far easier to test.

### Singleton services

In some cases, it's desirable to enforce that only a single instance of a service exists in an application. To do this, simply use the `SingletonPlugin` instead of the `Plugin` class:

```js
import {SingletonPlugin} from 'fusion-core';

export default () => {
  return new SingletonPlugin({
    Service: class {
      constructor() {
        console.log('only gets instantiated once');
      }
    },
  })
}
```

The singleton service instance can be acquired using the `.of` method. Calling `.of(ctx)` from a middleware returns the same instance for all requests.

```js
const Thing = app.plugin(MyThing);
const instance = Thing.of();
```

### Advanced plugins

Plugins can have both services and middlewares at the same time. This is useful for complex plugins where there's a need for a programmatic API _and_ a need to act on `ctx`, such wrapping the React tree with providers.

The plugin instance has the following shape `{Service, middleware, of}`.

#### Encapsulating a middleware

To add a service _and_ a middleware to a plugin, simply declare them both as options to the `Plugin` constructor:

```js
import {Plugin} from 'fusion-core';

export default () => {
  return new Plugin({
    Service: class {
      constructor() {
        console.log('only gets instantiated once');
      }
    },
    middleware(ctx, next) {
      console.log('runs on every request');
      return next();
    },
  })
}
```

To use a service instance in the middleware, call `this.of(ctx)` from the middleware:

```js
import {Plugin} from 'fusion-core';

export default () => {
  return new Plugin({
    Service: class UrlTeller {
      constructor(ctx) {
        this.url = ctx.url
      }
      tellUrl() {
        console.log('The url is ' + this.url);
      }
    },
    middleware(ctx, next) {
      const urlTeller = this.of(ctx);
      urlTeller.tellUrl();

      return next();
    },
  });
}
```

Note: make sure your middleware function is not an arrow function when you use `this`!

#### Static methods in services

To use static methods from the service, you can access the class via the `Service` property:

```js
// my-thing.js
export default () => {
  return new Plugin({
    Service: class {
      static someMethod() {
        // ...
      }
    }
  })
}

// elsewhere
import MyThing from './my-thing';

const Thing = app.plugin(MyThing);

Thing.Service.someMethod();
```
