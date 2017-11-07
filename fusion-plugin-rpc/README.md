# fusion-plugin-rpc

Fetch data on the server and client with an RPC style interface.

If you're using React, you should use [`fusion-plugin-rpc-react`](../fusion-plugin-rpc-react) instead of this package. If you're also using Redux, you should use [`fusion-plugin-rpc-redux-react`](../fusion-plugin-rpc-redux-react).

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
import App from 'fusion-react';
import RPC from 'fusion-plugin-rpc';
import fetch from 'unfetch';

// Define your rpc methods server side
const handlers = __NODE__ && {
  getUser: async (args, ctx) => {
    return {some: 'data' + args};
  },
};

export default () => {
  const app = new App(<div></div>);

  const Api = app.plugin(RPC, {handlers, fetch});
  app.plugin((ctx, next) => {
    Api.of(ctx).getUser(1).then(console.log) // {some: 'data1'}
  });

  return app;
}
```

---

### API

```js
const Api = app.plugin(RPC, {handlers, fetch, EventEmitter});
```

- `handlers: Object<(...args: any) => Promise>` - Server-only. Required. A map of server-side RPC method implementations
- `fetch: (url: string, options: Object) => Promise` - Browser-only. Required. A `fetch` implementation
- `EventEmitter` - Server-only. Optional. An event emitter plugin such as [fusion-plugin-universal-events](../fusion-plugin-universal-events)

##### Instance methods

```js
const instance = Api.of(ctx)
```

- `instance: Object` - Has the same method names and signatures as their counterparts in `handlers`.
