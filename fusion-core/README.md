# fusion-core

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The `fusion-core` package provides a generic entry point class for Fusion.js applications that is used by the Fusion.js runtime. It also provides primitives for implementing server-side code, and utilities for registering plugins into an application to augment its functionality.

If you're using React, you should use the [`fusion-react`](https://github.com/fusionjs/fusionjs/tree/master/fusion-react) package instead of `fusion-core`.

---

### Table of contents

* [Usage](#usage)
* [API](#api)
  * [App](#app)
  * [Dependency registration](#dependency-registration)
  * [Plugin](#plugin)
  * [Token](#token)
  * [Memoization](#memoization)
  * [Middleware](#middleware)
  * [Sanitization](#sanitization)
  * [Virtual modules](#virtual-modules)
* [Examples](#examples)

---

### Usage

```js
// main.js
import React from 'react';
import ReactDOM from 'react-dom';
import {renderToString} from 'react-dom/server';
import App from 'fusion-core';

const el = <div>Hello</div>;

const render = el =>
  __NODE__
    ? `<div id="root">${renderToString(el)}</div>`
    : ReactDOM.render(el, document.getElementById('root'));

export default function() {
  return new App(el, render);
}
```

---

### API

#### App

```js
import App from 'fusion-core';
```

A class that represents an application. An application is responsible for rendering (both virtual DOM and server-side rendering). The functionality of an application is extended via [plugins](#plugin).

**Constructor**

```flow
const app: App = new App(el: any, render: Plugin<Render>|Render);
```

* `el: any` - a template root. In a React application, this would be a React element created via `React.createElement` or a JSX expression.
* `render: Plugin<Render>|Render` - defines how rendering should occur. A Plugin should provide a value of type `Render`
  * `type Render = (el:any) => any`

**app.register**

```flow
app.register(plugin: Plugin);
app.register(token: Token, plugin: Plugin);
app.register(token: Token, value: any);
```

Call this method to register a plugin or configuration value into a Fusion.js application.

You can optionally pass a token as the first argument to associate the plugin/value to the token, so that they can be referenced by other plugins within Fusion.js' dependency injection system.

* `plugin: Plugin` - a [Plugin](#plugin) created via [`createPlugin`](#createplugin)
* `token: Token` - a [Token](#token) created via [`createToken`](#createtoken)
* `value: any` - a configuration value
* returns `undefined`

**app.middleware**

```js
app.middleware((deps: Object<string, Token>), (deps: Object) => Middleware);
app.middleware((middleware: Middleware));
```

* `deps: Object<string,Token>` - A map of local dependency names to [DI tokens](#token)
* `middleware: Middleware` - a [middleware](#middleware)
* returns `undefined`

This method is a shortcut for registering middleware plugins. Typically, you should write middlewares as plugins so you can organize different middlewares into different files.

**app.enhance**

```flow
app.enhance(token: Token, value: any => Plugin | Value);
```

This method is useful for composing / enhancing functionality of existing tokens in the DI system.

**app.cleanup**

```js
await app.cleanup();
```

Calls all plugin cleanup methods. Useful for testing.

* returns `Promise`

---

#### Dependency registration

##### ElementToken

```js
import App, {ElementToken} from 'fusion-core';
app.register(ElementToken, element);
```

The element token is used to register the root element with the Fusion.js app. This is typically a React element.

##### RenderToken

```js
import ReactDOM from 'react-dom';
import {renderToString} from 'react-dom/server';
const render = el =>
  __NODE__
    ? renderToString(el)
    : ReactDOM.render(el, document.getElementById('root'));
import App, {RenderToken} from 'fusion-core';
const app = new App();
app.register(RenderToken, render);
```

The render token is used to register the render function with the Fusion.js app. This is a function that knows how to
render your application on the server/browser, and allows `fusion-core` to remain agnostic of the virtual DOM library.

##### SSRDeciderToken

```js
import App, {SSRDeciderToken} from 'fusion-core';
app.enhance(SSRDeciderToken, SSRDeciderEnhancer);
```

Ths `SSRDeciderToken` can be enhanced to control server rendering logic.

##### HttpServerToken

```js
import App, {HttpServerToken} from 'fusion-core';
app.register(HttpServerToken, server);
```

The `HttpServerToken` is used to register the current server as a dependency that can be utilized from plugins that require
access to it. This is normally not required but is available for specific usage cases.

##### RouteTagsToken

```js
import {RouteTagsToken, createPlugin} from 'fusion-core';

createPlugin({
  deps: {
    RouteTags: RouteTagsToken,
  },
  middleware({RouteTags}) {
    return (ctx, next) => {
      const routeTags = RouteTags.from(ctx);
      if (ctx.path === '/graphql') {
        routeTags.name = 'graphql';
        routeTags.customTag = 'custom-value';
      }
    }
  }
});
```

The RouteTagsToken exposes an Object for holding tags related to a given request. There is a default tag called 'name' which refers
to a stable name for a given route. This is useful for situations where you need low cardinality values for metrics and tracing. By
default, the route name is set to 'unknown_route' by fusion-core. If you are using `fusion-plugin-react-router` it will automatically
set the route name to the matched react route.

##### EnableMiddlewareTimingToken

```js
import App, {EnableMiddlewareTimingToken} from 'fusion-core';
app.register(EnableMiddlewareTimingToken, true);
```

If `EnableMiddlewareTimingToken` is set to `true`, Fusion.js will emit middleware timing information that can be retrieved by inspecting
the `ctx.timing.middleware` property from within middleware. See the RFC [here](https://github.com/uber/fusionjs/blob/master/public/rfcs/text/0000-middleware-timing.md).

---

#### Plugin

A plugin encapsulates some functionality into a single coherent package that exposes a programmatic API and/or installs middlewares into an application.

Plugins can be created via `createPlugin`

```flow
type Plugin {
  deps: Object<string, Token>,
  provides: (deps: Object) => any,
  middleware: (deps: Object, service: any) => Middleware,
  cleanup: ?(service: any) => void
}
```

##### createPlugin

```js
import {createPlugin} from 'fusion-core';
```

Creates a plugin that can be registered via `app.register()`

```flow
const plugin: Plugin = createPlugin({
  deps: Object,
  provides: (deps: Object) => any,
  middleware: (deps: Object, service: any) => Middleware,
  cleanup: ?(service: any) => void
});
```

* `deps: Object<string, Token>` - A map of local dependency names to [DI tokens](#token)
* `provides: (deps: Object) => any` - A function that provides a service
* `middleware: (deps: Object, service: any) => Middleware` - A function that provides a middleware
* `cleanup: ?(service: any)` => Runs when `app.cleanup` is called. Useful for tests
* returns `plugin: Plugin` - A Fusion.js plugin

---

#### Token

A token is a label that can be associated to a plugin or configuration when they are registered to an application. Other plugins can then import them via dependency injection, by mapping a object key in `deps` to a token

```flow
type Token {
  name: string,
  ref: mixed,
  type: number,
  optional: ?Token,
}
```

##### createToken

```flow
const token:Token = createToken(name: string);
```

* `name: string` - a human-readable name for the token. Used for generating useful error messages.
* returns `token: Token`

---

#### Memoization

```flow
import {memoize} from 'fusion-core';
```

It may be desirable to share the same instance of a particular request-scoped value across different plugins. For example, session state, which is associated with specific requests but might be used in several plugins.

Fusion.js provides a `memoize` utility function for this purpose:

* `fn: (ctx: Context) => any` - A function to be memoized
* returns `memoized: (ctx: Context) => any`

For example, using session state as an example:

```
const getSession = memoize(ctx => createSession(ctx));
```

The first time `getSession` is invoked with a given `ctx` object, `createSession(ctx)` will be invoked and a session state instance will be created. Then, any subsequent calls of `getSession` with the exact same `ctx` will yield the existing session state instance for that request.

Under the hood, these lookups work similar to a `WeakMap` so these memoized values are garbage collected along with each `ctx` object.

Note that by convention, Fusion.js plugins provide these memoized getters via a `from` method.

```js
const memoized = {from: memoize((fn: (ctx: Context) => any))};
```

This method is meant to be called from a [middleware](#middleware), for example:

```js
createPlugin({
  deps: {Session: SessionToken},
  middleware({Session}) {
    return (ctx, next) => {
      const state = Session.from(ctx);
    }
  }
}
```

---

#### Middleware

```flow
type Middleware = (ctx: Context, next: () => Promise) => Promise
```

* `ctx: Context` - a [Context](#context)
* `next: () => Promise` - An asynchronous function call that represents rendering

A middleware function is essentially a [Koa](http://koajs.com/) middleware, a function that takes two argument: a `ctx` object that has some Fusion.js-specific properties, and a `next` callback function.
However, it has some additional properties on `ctx` and can run both on the `server` and the `browser`.

In Fusion.js, the `next()` call represents the time when virtual DOM rendering happens. Typically, you'll want to run all your logic before that, and simply have a `return next()` statement at the end of the function. Even in cases where virtual DOM rendering is not applicable, this pattern is still the simplest way to write a middleware.

In a few more advanced cases, however, you might want to do things _after_ virtual dom rendering. In that case, you can call `await next()` instead:

```js
const middleware = () => async (ctx, next) => {
  // this happens before virtual dom rendering
  const start = new Date();

  await next();

  // this happens after virtual rendeing, but before the response is sent to the browser
  console.log('timing: ', new Date() - start);
};
```

Plugins can add dependency injected middlewares.

```js
// fusion-plugin-some-api
const APIPlugin = createPlugin({
  deps: {
    logger: LoggerToken,
  },
  provides: ({logger}) => {
    return new APIClient(logger);
  },
  middleware: ({logger}, apiClient) => {
    return async (ctx, next) => {
      // do middleware things...
      await next();
      // do middleware things...
    };
  },
});
```

##### Context

Middlewares receive a `ctx` object as their first argument. This object has a property called `element` in both server and client.

* `ctx: Object`
  * `element: Object`

Additionally, when server-side rendering a page, Fusion.js sets `ctx.template` to an object with the following properties:

* `ctx: Object`
  * `template: Object`
    * `htmlAttrs: Object` - attributes for the `<html>` tag. For example `{lang: 'en-US'}` turns into `<html lang="en-US">`. Default: empty object
    * `bodyAttrs: Object` - attributes for the `<body>` tag. For example `{test: 'test'}` turns into `<body test="test">`. Default: empty object
    * `title: string` - The content for the `<title>` tag. Default: empty string
    * `head: Array<SanitizedHTML>` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array
    * `body: Array<SanitizedHTML>` - A list of [sanitized HTML strings](#html-sanitization). Default: empty array

When a request does not require a server-side render, `ctx.body` follows regular Koa semantics.

In the server, `ctx` also exposes the same properties as a [Koa context](http://koajs.com/#context)

* `ctx: Object`
  * `req: http.IncomingMessage` - [Node's `request` object](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  * `res: Response` - [Node's `response` object](https://nodejs.org/api/http.html#http_class_http_serverresponse)
  * `request: Request` - [Koa's `request` object](https://koajs.com/#request): View Koa request details
    * `header: Object` - alias of `request.headers`
    * `headers: Object` - map of parsed HTTP headers
    * `method: string` - HTTP method
    * `url: string` - request URL
    * `originalUrl: string` - same as `url`, except that `url` may be modified (e.g. for URL rewriting)
    * `path: string` - request pathname
    * `query: Object` - parsed querystring as an object
    * `querystring: string` - querystring without `?`
    * `host: string` - host and port
    * `hostname: string` - get hostname when present. Supports X-Forwarded-Host when app.proxy is true, otherwise Host is used
    * `length:number` - return request Content-Length as a number when present, or undefined.
    * `origin: string` - request origin, including protocol and host
    * `href: string` - full URL including protocol, host, and URL
    * `fresh: boolean` - check for cache negotiation
    * `stale: boolean` - inverse of `fresh`
    * `socket: Socket` - request socket
    * `protocol: string` - return request protocol, "https" or "http". Supports X-Forwarded-Proto when app.proxy is true
    * `secure: boolean` - shorthand for ctx.protocol == "https" to check if a request was issued via TLS.
    * `ip: string` - remote IP address
    * `ips: Array<string>` - proxy IPs
    * `subdomains: Array<string>` - return subdomains as an array.For example, if the domain is "tobi.ferrets.example.com": If app.subdomainOffset is not set, ctx.subdomains is \["ferrets", "tobi"\]
    * `is: (...types: ...string) => boolean` - request type check `is('json', 'urlencoded')`
    * `accepts: (...types: ...string) => boolean` - request MIME type check
    * `acceptsEncodings: (...encodings: ...string) => boolean` - check if encodings are acceptable
    * `acceptsCharset: (...charsets: ...string) => boolean` - check if charsets are acceptable
    * `acceptsLanguages: (...languages: ...string) => boolean` - check if langs are acceptable
    * `get: (name: String) => string` - returns a header field

  * `response: Response` - [Koa's `response` object](https://koajs.com/#response): View Koa response details
    * `header: Object` - alias of `request.headers`
    * `headers: Object` - map of parsed HTTP headers
    * `socket: Socket` - response socket
    * `status: String` - response status. By default, `response.status` is set to `404` unlike node's `res.statusCode` which defaults to `200`.
    * `message: String` - response status message. By default, `response.message` is associated with `response.status`.
    * `length: Number` - response Content-Length as a number when present, or deduce from `ctx.body` when possible, or `undefined`.
    * `body: String, Buffer, Stream, Object(JSON), null` - get response body
    * `get: (name: String) => string` - returns a header field
    * `set: (field: String, value: String) => undefined` - set response header `field` to `value`
    * `set: (fields: Object) => undefined` - set response `fields`
    * `append: (field: String, value: String) => undefined` - append response header `field` with `value`
    * `remove: (field: String) => undefined` - remove header `field`
    * `type: String` - response `Content-Type`
    * `is: (...types: ...string) => boolean` - response type check `is('json', 'urlencoded')`
    * `redirect: (url: String, alt: ?String) => undefined`- perform a 302 redirect to `url`
    * `attachment (filename: ?String) => undefined` - set `Content-Disposition` to "attachment" to signal the client to prompt for download. Optionally specify the `filename` of the download.
    * `headerSent: boolean` - check if a response header has already been sent
    * `lastModified: Date` - `Last-Modified` header as a `Date`
    * `etag: String` - set the ETag of a response including the wrapped `"`s.
    * `vary: (field: String) => String` - vary on `field`
    * `flushHeaders () => undefined` - flush any set headers, and begin the body

  * `cookies: {get, set}` - cookies based on [Cookie Module](https://github.com/pillarjs/cookies): View Koa cookies details
    * `get: (name: string, options: ?Object) => string` - get a cookie
      * `name: string`
      * `options: {signed: boolean}`
    * `set: (name: string, value: string, options: ?Object)`
      * `name: string`
      * `value: string`
      * `options: Object` - Optional
        * `maxAge: number` - a number representing the milliseconds from Date.now() for expiry
        * `signed: boolean` - sign the cookie value
        * `expires: Date` - a Date for cookie expiration
        * `path: string` - cookie path, /' by default
        * `domain: string` - cookie domain
        * `secure: boolean` - secure cookie
        * `httpOnly: boolean` - server-accessible cookie, true by default
        * `overwrite: boolean` - a boolean indicating whether to overwrite previously set cookies of the same name (false by default). If this is true, all cookies set during the same request with the same name (regardless of path or domain) are filtered out of the Set-Cookie header when setting this cookie.

  * `state: Object` - recommended namespace for passing information through middleware and to your frontend views `ctx.state.user = await User.find(id)`
  * `throw: (status: ?number, message: ?string, properties: ?Object) => void` - throws an error
    * `status: number` - HTTP status code
    * `message: string` - error message
    * `properties: Object` - is merged to the error object
  * `assert: (value: any, status: ?number, message: ?string, properties: ?Object)` - throws if `value` is falsy. Uses [Assert](https://github.com/jshttp/http-assert)
    * `value: any`
    * `status: number` - HTTP status code
    * `message: string` - error message
    * `properties: Object` - is merged to the error object
  * `respond: boolean` - set to true to bypass Koa's built-in response handling. You should not use this flag.
  * `app: Object` - a reference to the Koa instance

#### Sanitization

* **html**

  ```js
  import {html} from 'fusion-core';
  ```

  A template tag that creates safe HTML objects that are compatible with `ctx.template.head` and `ctx.template.body`. Template string interpolations are escaped. Use this function to prevent XSS attacks.

  ```flow
  const sanitized: SanitizedHTML = html`<meta name="viewport" content="width=device-width, initial-scale=1">`
  ```

* **escape**

  ```js
  import {escape} from 'fusion-core';
  ```

  Escapes HTML

  ```flow
  const escaped:string = escape(value: string)
  ```

  * `value: string` - the string to be escaped

* **unescape**

  ```js
  import {unescape} from 'fusion-core';
  ```

  Unescapes HTML

  ```flow
  const unescaped:string = unescape(value: string)
  ```

  * `value: string` - the string to be unescaped

* **dangerouslySetHTML**

  ```js
  import {dangerouslySetHTML} from 'fusion-core';
  ```

  A function that blindly creates a trusted SanitizedHTML object without sanitizing against XSS. Do not use this function unless you have manually sanitized your input and written tests against XSS attacks.

  ```flow
  const trusted:string = dangerouslySetHTML(value: string)
  ```

  * `value: string` - the string to be trusted

#### Virtual modules

Virtual modules are the means for userland consumption of Fusion.js-owned static analysis and build artifacts in a way that:

1. Does not expose any underlying implementation details, such as module bundlers or transpilers
2. Provides a strong API contract with type safety with editor support
3. Provides a high degree of robustness with build-time errors in cases where static analysis will fail, including user misuse like not providing statically analyzable arguments.

In practice, a virtual module is implemented via a coupled agglomeration of babel plugin(s), webpack loader(s), and webpack plugin(s).

Fusion.js currently provides the following virtual modules:

* **assetUrl**

  Converts asset relative paths (e.g. `./src/asset.js`) to the fully qualified URL (e.g. `/_static/asset.js`).

  ```js
  import {assetUrl} from 'fusion-core';

  assetUrl('path/to/some/file');
  // => Path to the asset
  ```

* **chunkId**

  This is a useful building block for implementing things such as translations and module async/lazy loading.

  ```js
  import {chunkId} from 'fusion-core';

  chunkId('path/to/some/module');
  // => Array of client-side chunk ids for the module
  ```

* **syncChunkIds**

* **syncChunkPaths**

* **workerUrl**

  The `workerUrl` virtual module allows transpiling and loading a web worker. The result of the virtual call should be passed into the `Worker` constructor.

  ```js
  import {workerUrl} from 'fusion-core';

  // Path to the asset
  const url = workerUrl('path/to/some/worker.js');
  const myWorker = new Worker(url);
  ```

---

### Examples

#### Dependency injection

To use plugins, you need to register them with your Fusion.js application. You do this by calling
`app.register` with the plugin and a token for that plugin. The token is a value used to keep track of
what plugins are registered, and to allow plugins to depend on one another.

You can think of Tokens as names of interfaces. There's a list of common tokens in the `fusion-tokens` package.

Here's how you create a plugin:

```js
import {createPlugin} from 'fusion-core';
// fusion-plugin-console-logger
const ConsoleLoggerPlugin = createPlugin({
  provides: () => {
    return console;
  },
});
```

And here's how you register it:

```js
// src/main.js
import ConsoleLoggerPlugin from 'fusion-plugin-console-logger';
import {LoggerToken} from 'fusion-tokens';
import App from 'fusion-core';

export default function main() {
  const app = new App(...);
  app.register(LoggerToken, ConsoleLoggerPlugin);
  return app;
}
```

Now let's say we have a plugin that requires a `logger`. We can map `logger` to `LoggerToken` to inject the logger provided by `ConsoleLoggerPlugin` to the `logger` variable.

```js
// fusion-plugin-some-api
import {createPlugin} from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';

const APIPlugin = createPlugin({
  deps: {
    logger: LoggerToken,
  },
  provides: ({logger}) => {
    logger.log('Hello world');
    return new APIClient(logger);
  },
});
```

The API plugin is declaring that it needs a logger that matches the API documented by the `LoggerToken`. The user then provides an implementation of that logger by registering the `fusion-plugin-console-logger` plugin with the `LoggerToken`.

#### Implementing HTTP endpoints

You can use a plugin to implement a RESTful HTTP endpoint. To achieve this, run code conditionally based on the URL of the request

```js
app.middleware(async (ctx, next) => {
  if (ctx.method === 'GET' && ctx.path === '/api/v1/users') {
    ctx.body = await getUsers();
  }
  return next();
});
```

#### Serialization and hydration

A plugin can be atomically responsible for serialization/deserialization of data from the server to the client.

The example below shows a plugin that grabs the project version from package.json and logs it in the browser:

```js
// plugins/version-plugin.js
import fs from 'fs';
import {html, unescape, createPlugin} from 'fusion-core'; // html sanitization

export default createPlugin({
  middleware: () => {
    const data = __NODE__ && JSON.parse(fs.readFileSync('package.json').toString());
    return async (ctx, next) => {
      if (__NODE__) {
        ctx.template.head.push(html`<meta id="app-version" content="${data.version}">`);
        return next();
      } else {
        const version = unescape(document.getElementById('app-version').content);
        console.log(`Version: ${version}`);
        return next();
      }
    });
  }
});
```

We can then consume the plugin like this:

```js
// main.js
import React from 'react';
import App from 'fusion-core';
import VersionPlugin from './plugins/version-plugin';

const root = <div>Hello world</div>;

const render = el =>
  __NODE__ ? renderToString(el) : render(el, document.getElementById('root'));

export default function() {
  const app = new App(root, render);
  app.register(VersionPlugin);
  return app;
}
```

#### HTML sanitization

Default-on HTML sanitization is important for preventing security threats such as XSS attacks.

Fusion automatically sanitizes `htmlAttrs` and `title`. When pushing HTML strings to `head` or `body`, you must use the `html` template tag to mark your HTML as sanitized:

```js
import {html} from 'fusion-core';

const middleware = (ctx, next) => {
  if (ctx.element) {
    const userData = await getUserData();
    // userData can't be trusted, and is automatically escaped
    ctx.template.body.push(html`<div>${userData}</div>`)
  }
  return next();
}
```

If `userData` above was `<script>alert(1)</script>`, ththe string would be automatically turned into `<div>\u003Cscript\u003Ealert(1)\u003C/script\u003E</div>`. Note that only `userData` is escaped, but the HTML in your code stays intact.

If your HTML is complex and needs to be broken into smaller strings, you can also nest sanitized HTML strings like this:

```js
const notUserData = html`<h1>Hello</h1>`;
const body = html`<div>${notUserData}</div>`;
```

Note that you cannot mix sanitized HTML with unsanitized strings:

```js
ctx.template.body.push(html`<h1>Safe</h1>` + 'not safe'); // will throw an error when rendered
```

Also note that only template strings can have template tags (i.e. <code>html&#x60;&lt;div&gt;&lt;/div&gt;&#x60;</code>). The following are NOT valid Javascript: `html"<div></div>"` and `html'<div></div>'`.

If you get an <code>Unsanitized html. You must use html&#x60;[your html here]&#x60;</code> error, remember to prepend the `html` template tag to your template string.

If you have already taken steps to sanitize your input against XSS and don't wish to re-sanitize it, you can use `dangerouslySetHTML(string)` to let Fusion.js render the unescaped dynamic string.

#### Enhancing a dependency

If you wanted to add a header to every request sent using the registered `fetch`.

```js
app.register(FetchToken, window.fetch);
app.enhance(FetchToken, fetch => {
  return (url, params = {}) => {
    return fetch(url, {
      ...params,
      headers: {
        ...params.headers,
        'x-test': 'test',
      },
    });
  };
});
```

You can also return a `Plugin` from the enhancer function, which `provides` the enhanced value, allowing
the enhancer to have dependencies and even middleware.

```js
app.register(FetchToken, window.fetch);
app.enhance(FetchToken, fetch => {
  return createPlugin({
    provides: () => (url, params = {}) => {
      return fetch(url, {
        ...params,
        headers: {
          ...params.headers,
          'x-test': 'test',
        },
      });
    },
  });
});
```

#### Controlling SSR behavior

By default we do not perfrom SSR for any paths that match the following extensions: js, gif, jpg, png, pdf and json. You can control SSR behavior by enhancing the SSRDeciderToken. This will give you the ability to apply custom logic around which routes go through the renderer. You may enhance the SSRDeciderToken with either a function, or a plugin if you need dependencies.

```js
import {SSRDeciderToken} from 'fusion-core';
app.enhance(SSRDeciderToken, decide => ctx =>
  decide(ctx) && !ctx.path.match(/ignore-ssr-route/)
);
```

#### Troubleshooting

Most common dependency-injection errors in Fusion.js will link to
a troubleshooting document in this repo. If you encounter a registration error
that does not provide a link, please create an issue
[here](https://github.com/fusionjs/fusionjs/issues/new) containing minimal
steps to reproduce.

##### Registered without depending

Moved
[here](https://github.com/fusionjs/fusionjs/tree/master/errors/registered-without-depending.md)

