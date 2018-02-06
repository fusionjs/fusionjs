# Creating endpoints

FusionJS provides an [RPC plugin](https://github.com/fusionjs/fusion-plugin-rpc-redux-react) that integrates with Redux and React/Preact. We recommend using that RPC plugin rather than writing HTTP endpoints manually.

Here we will implement an HTTP endpoint manually to better understand how FusionJS middlewares work.

The simplest way to write a FusionJS plugin is a [middleware plugin](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/creating-a-plugin.md#middlewares):

```js
// src/plugins/example.js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      return next();
    }
  },
};
```

To write a middleware plugin, we export a _factory_ function that return a _middleware_ function. The middleware receives a `ctx` argument that has various properties, and a `next` function that it must call. It works the same way as a [Koa](http://koajs.com) middleware.

Let's say we want to implement a `GET /api/ping` endpoint. This endpoint simply responds with `{ok: 1}`. To do that, we check that the `method` and `path` are correct and we set `body` to the data we want to return:

```js
// src/plugins/example.js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      if (ctx.method === 'GET' && ctx.path === '/api/ping') {
        ctx.body = {ok: 1};
      }
      return next();
    };
  },
});
```

There's one issue left with the code above: FusionJS code runs isomorphically by default, but we only want to run that code in the server. To do so, add a [code fence](https://github.com/fusionjs/fusion-core/blob/master/docs/guides/universal-code.md):

```js
// src/plugins/example.js
import {createPlugin} from 'fusion-core';

export default __NODE__ &&
  createPlugin({
    middleware() {
      return (ctx, next) => {
        if (ctx.method === 'GET' && ctx.path === '/api/ping') {
          ctx.body = {ok: 1};
        }
        return next();
      };
    },
  });
```

Next, register the plugin:

```js
// src/main.js
import App from 'fusion-react';
import Example from './plugins/example';

export default () => {
  const app = new App();
  app.register(Example);
  return app;
};
```

That's it! Now, you can test your new endpoint. From your browser developer console:

```js
fetch('/api/ping')
  .then(r => r.json())
  .then(console.log); // {ok: 1}
```

### Body parsing

Let's implement `POST /api/echo`, which responds with the body of a request. To do that, we can use the `koa-bodyparser` package:

```js
import bodyParser from 'koa-bodyparser';

export default __NODE__ &&
  createPlugin({
    middleware() {
      const parseBody = bodyParser();
      return async (ctx, next) => {
        if (ctx.method === 'POST' && ctx.path === '/api/echo') {
          await parseBody(ctx, Promise.resolve);
          ctx.body = ctx.request.body;
        }
        return next();
      };
    },
  });
```

Notice that we `await parseBody()` because body parsing is asynchronous. You can similarly await other asynchronous calls such as database calls or microservice requests.
