# fusion-plugin-rpc

[![Build status](https://badge.buildkite.com/5165e82185b13861275cd0a69f29c2a13bc66dfb9461ee4af5.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-rpc)

Fetch data on the server and client with an
[RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) style interface.

RPC is a natural way of expressing that a server-side function should be run in
response to a client-side function call. Unlike
[RESTful architectures](https://en.wikipedia.org/wiki/Representational_state_transfer),
RPC-based architectures are not required to conform to statelessness constraints
and are free to return session-scoped data. Additionally, the semantics of RPC
calls are not constrained by the availability of suitably-descriptive HTTP
methods and RPC calls can express complex state change requests more naturally
as verbs (e.g. `returnProduct(id)`) rather than object-orientation (e.g.
`PATCH /api/orders/:id`).

If you're using React/Redux, you should use
[`fusion-plugin-rpc-redux-react`](https://github.com/fusionjs/fusion-plugin-rpc-redux-react)
instead of this package.

---

### Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Setup](#setup)
- [API](#api)
  - [Registration API](#registration-api)
  - [Dependencies](#dependencies)
  - [Service API](#service-api)
  - [`mock`](#mock)

---

### Installation

```
yarn add fusion-plugin-rpc
```

---

### Usage

```js
import {createPlugin} from 'fusion-core';
export default createPlugin({
  deps: {RPC: RPCToken},
  middleware: ({RPCFactory}) => (ctx, next) => {
    RPC.from(ctx).request('getUser', 1).then(console.log);
  }
);
```

---

### Setup

```js
// src/main.js
import React from 'react';
import App, {createPlugin} from 'fusion-core';
import RPC, {
  RPCToken,
  RPCHandlersToken,
  ResponseError,
} from 'fusion-plugin-rpc';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

// Define your rpc methods server side
const handlers = __NODE__ && {
  getUser: async (args, ctx) => {
    return {some: 'data' + args};
  },
  test: async (args, ctx) => {
    // Error Handling Example
    try {
      doThing();
    } catch (e) {
      const error = new ResponseError('Failed to do thing');
      error.code = 'DOTHING';
      error.meta = {
        custom: 'metadata',
      };
      throw error;
    }
  },
};

export default () => {
  const app = new App(<div />);

  app.register(RPCToken, RPC);
  app.register(UniversalEventsToken, UniversalEvents);
  __NODE__
    ? app.register(RPCHandlersToken, handlers)
    : app.register(FetchToken, fetch);

  return app;
};
```

---

### API

#### Registration API

##### `RPC`

```js
import RPC from 'fusion-plugin-rpc';
```

The RPC plugin. Provides the RPC [service API](#service-api).

##### `RPCToken`

```js
import {RPCToken} from 'fusion-plugin-rpc-redux-react';
```

The canonical token for the RPC plugin. Typically, it should be registered with
the [RPC](#rpc) plugin.

#### Dependencies

##### `UniversalEventsToken`

Required. See
[https://github.com/fusionjs/fusion-plugin-universal-events#api](https://github.com/fusionjs/fusion-plugin-universal-events#api)

##### `RPCHandlersToken`

```js
import {RPCHandlersToken} from 'fusion-plugin-rpc-redux-react';
```

Configures what RPC handlers exist. Required. Server-only.

###### Types

```flow
type RPCHandlers = Object<string, () => any>
```

You can register a value of type `RPCHandlers` or a Plugin that provides a value
of type `RPCHandlers`.

##### `FetchToken`

Required. Browser-only. See
[https://github.com/fusionjs/fusion-tokens#fetchtoken](https://github.com/fusionjs/fusion-tokens#fetchtoken)

##### `ReduxToken`

Required. See
[https://github.com/fusionjs/fusion-plugin-react-redux](https://github.com/fusionjs/fusion-plugin-react-redux)

##### `ReducerToken`

Required. See
[https://github.com/fusionjs/fusion-plugin-react-redux](https://github.com/fusionjs/fusion-plugin-react-redux)

---

#### Service API

```js
const rpc: RPC = Rpc.from((ctx: Context));
```

- `ctx: Context` - Required. A
  [Fusion.js context](https://github.com/fusionjs/fusion-core#context)
- returns `rpc: {request: (method: string, args: any) => Promise<any>}`

  - `request: (method: string, args: any) => Promise<any>` - Makes an RPC call
    via an HTTP request. If on the server, this will directly call the `method`
    handler with `(args, ctx)`.

    If on the browser, this will `POST` to `/api/${method}` endpoint with JSON
    serialized args as the request body. The server will then deserialize the
    args and call the rpc handler. The response will be serialized and send back
    to the browser.

    - `method: string` - Required. The RPC method name
    - `args: any` - Optional. Arguments to pass to the server-side RPC handler.
      Must be JSON-serializable.

### mock

The package also exports a mock RPC plugin which can be useful for testing. For
example:

```js
import {mock as MockRPC, RPCToken} from 'fusion-plugin-rpc';

app.register(RPCToken, mock);
```

### Error Handling

Use the `ResponseError` error subclass for sending error responses. If this
error class is not used, a generic message will be sent to the client.

```js
import {ResponseError} from 'fusion-plugin-rpc';

function testHandler() {
  try {
    doThing();
  } catch (e) {
    const error = new ResponseError('Failed to do thing');
    error.code = 'DOTHING';
    error.meta = {
      custom: 'metadata',
    };
    throw error;
  }
}
```

### Generating mock RPC handlers from fixtures

The package also exports a getMockRpcHandlers util which can be useful for testing.
Fixtures need to be of the following type

```js
type RpcResponse = Object | ResponseError;
type RpcResponseMap = Array<{
  args: Array<*>,
  response: RpcResponse,
}>;
type RpcFixtureT = {[string]: RpcResponseMap | RpcResponse};
```

`getMockRpcHandlers` has the following interface:

```js
type getMockRpcHandlersT = (
  fixtures: Array<RpcFixtureT>,
  onMockRpc?: OnMockRpcCallbackT
) => HandlerType;
```

For example:

```js
import {getMockRpcHandlers, ResponseError} from 'fusion-plugin-rpc';

const rpcFixtures = [
  {
    getUser: {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 123,
    },
  },
  {
    updateUser: [{
      args: [{firstName: 'Jane'}],
      response: {
        firstName: 'John',
        lastName: 'Doe',
        uuid: 123,
      },
    }, {
      args: [{firstName: ''}],
      response: new ResponseError('Username cant be empty'),
    }]
  },
];

const mockRpcHandlers = getMockRpcHandlers(rpcFixtures);

const user = await mockRpcHandlers.getUser();

try {
  const user = await mockRpcHandlers.updateUser({firstName: ''});
} catch (updatedUserError) {
  // When error object is passed as response in fixtures,
  // it will be considered as a failure scenario and will be thrown by rpc handler.
}
```
