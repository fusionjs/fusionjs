# fusion-plugin-rpc

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

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
[`fusion-plugin-rpc-redux-react`](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-rpc-redux-react)
instead of this package.

---

### Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Setup](#setup)
- [Customization](#customization)
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

### Customization

The plugin can accept an optional config token for modifying the default behavior.

#### Modify RPC Routes

```js
// src/main.js
import React from 'react';
import App, {createPlugin} from 'fusion-core';
import RPC, {
  RPCToken,
  RPCHandlersToken,
  ResponseError,
  RPCHandlersConfigToken,
} from 'fusion-plugin-rpc';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

import handlers from './redux/handlers';

export default () => {
  const app = new App(<div />);

  app.register(RPCHandlersConfigToken, {
    // Modify RPC endpoints to be accessible at /nested/api/rpcs/<RPC_ID>
    apiPath: 'nested/api/rpcs',
  });

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
[https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events#api](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events#api)

##### `RPCHandlersToken`

```js
import {RPCHandlersToken} from 'fusion-plugin-rpc';
```

Object with keys as the name of the handler and the value the handler implementation. Required. Server-only.

##### `RPCHandlersConfigToken`

```js
import {RPCHandlersConfigToken} from 'fusion-plugin-rpc';
```

Configures what RPC handlers exist. Required. Server-only.

##### `BodyParserOptionsToken`

```js
import {BodyParserOptionsToken} from 'fusion-plugin-rpc';
```

Configures options for `koa-bodyparser`. Optional. See available options [here](https://github.com/koajs/bodyparser#options).

For example, if you want to increase the limit for uploading large file sizes, set `jsonLimit` to a higher limit:

```js
app.register(BodyParserOptionsToken, {jsonLimit: '20mb'});
```

#### Types

```flow
type RPCHandlers = Object<string, () => any>
```

You can register a value of type `RPCHandlers` or a Plugin that provides a value
of type `RPCHandlers`.

##### `FetchToken`

Required. Browser-only. See
[https://github.com/fusionjs/fusionjs/tree/master/fusion-tokens#fetchtoken](https://github.com/fusionjs/fusionjs/tree/master/fusion-tokens#fetchtoken)

##### `ReduxToken`

Required. See
[https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-react-redux](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-react-redux)

##### `ReducerToken`

Required. See
[https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-react-redux](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-react-redux)

##### `RPCHandlersConfigToken`

Optional.

```flow
type RPCConfigType = {
  apiPath?: string,
}
```

##### `BodyParserOptionsToken`

Optional. See [koa-bodyparser Options type](https://github.com/flow-typed/flow-typed/blob/master/definitions/npm/koa-bodyparser_v4.x.x/flow_v0.104.x-/koa-bodyparser_v4.x.x.js#L9).

---

#### Service API

```js
const rpc: RPC = Rpc.from((ctx: Context));
```

- `ctx: Context` - Required. A
  [Fusion.js context](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#context)
- returns `rpc: {request: (method: string, args: any, headers: Object, options: RequestOptions) => Promise<any>}`

  - `request: (method: string, args: any) => Promise<any>` - Makes an RPC call
    via an HTTP request. If on the server, this will directly call the `method`
    handler with `(args, ctx)`.

    If on the browser, this will `POST` to `/api/${method}` (unless modified;
    see [customization](#customization)) endpoint with JSON serialized args as the
    request body. The server will then deserialize the args and call the rpc
    handler. The response will be serialized and send back to the browser.

    - `method: string` - Required. The RPC method name
    - `args: any` - Optional. Arguments to pass to the server-side RPC handler.
      Must be JSON-serializable or an instance of
      [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).
    - `headers: Object` - Optional. Browser only. HTTP headers to use when
      making the request from the browser to the server.
    - `options: RequestOptions` - Optional. Browser only. Additional request
      options to pass to the underlying `fetch` call.

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
