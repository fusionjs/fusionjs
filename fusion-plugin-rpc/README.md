# fusion-plugin-rpc

[![Build status](https://badge.buildkite.com/5165e82185b13861275cd0a69f29c2a13bc66dfb9461ee4af5.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-rpc)

Fetch data on the server and client with an RPC style interface.

If you're using React/Redux, you should use [`fusion-plugin-rpc-redux-react`](https://github.com/fusionjs/fusion-plugin-rpc-redux-react) instead of this package.

---

### Installation

```
yarn add fusion-plugin-rpc
```

---

### Example

```js
// src/main.js
import React from 'react';
import App, {createPlugin} from 'fusion-core';
import RPC, {RPCToken, RPCHandlersToken} from 'fusion-plugin-rpc';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

// Define your rpc methods server side
const handlers = __NODE__ && {
  getUser: async (args, ctx) => {
    return {some: 'data' + args};
  },
};

export default () => {
  const app = new App(<div></div>);
  // ...
  app.register(RPCToken, RPC);
  app.register(UniversalEventsToken, UniversalEvents);
  __NODE__
    ? app.register(RPCHandlersToken, handlers);
    : app.register(FetchToken, fetch);

  app.middleware(
    { RPCFactory: RPCToken },
    ({RPCFactory}) => (ctx, next) => {
      RPCFactory(ctx).request('getUser', 1).then(console.log) // {some: 'data1'}
    }
  );
  // ...
  return app;
}
```

---

### API

#### Dependency registration

```js
import {RPCHandlersToken} from 'fusion-plugin-rpc';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';

app.register(UniversalEventsToken, UniversalEvents);
__NODE__
  ? app.register(RPCHandlersToken, handlers);
  : app.register(FetchToken, fetch);
}
```

##### Required dependencies

Name | Type | Description
-|-|-
`UniversalEventsToken` | `UniversalEvents` | An event emitter plugin, such as the one provided by [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusion-plugin-universal-events).
`RPCHandlersToken` | `Object<(...args: any) => Promise>` | A map of server-side RPC method implementations.  Server-only.
`FetchToken` | `(url: string, options: Object) => Promise` | A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation.  Browser-only.

##### Factory

```js
const instance = RPC.from(ctx);
```

- `ctx: FusionContext` - Required. A [FusionJS context](https://github.com/fusionjs/fusion-core#context).

#### Instance methods

- `instance.request(method: string, args: any)` - make an rpc call to the `method` handler with `args`.

If on the server, this will directly call the `method` handler with `(args, ctx)`.

If on the browser, this will `POST` to `/api/${method}` endpoint with JSON serialized args as the request body. The server will then deserialize the args and call the rpc handler. The response will be serialized and send back to the browser.

### Testing

The package also exports a mock rpc plugin which can be useful for testing. For example:

```js
import {mock as MockRPC} from 'fusion-plugin-rpc';

app.register(RPCToken, mock);
```
