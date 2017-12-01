# fusion-rpc-redux

[![Build status](https://badge.buildkite.com/0a5101ffd6b6091e4d0066aa93b65b79a2e5f9141cb2b4316f.svg?branch=master)](https://buildkite.com/uberopensource/fusion-rpc-redux)

A collection of helper functions for working with Redux and RPC together

If using RPC from React components, you should use [`fusion-plugin-rpc-redux-react`](https://github.com/fusionjs/fusion-plugin-rpc-redux-react) instead of this package.

---

### Installation

```sh
yarn add fusion-rpc-redux
```

---

### API

#### `createRPCActions`

```js
const {start, success, failure} = createRPCActions('foo');
start('payload') // { type: 'FOO_START', payload: 'payload' }
success('payload') // { type: 'FOO_SUCCESS', payload: 'payload' }
failure('payload') // { type: 'FOO_FAILURE', payload: 'payload' }
```

#### `createRPCReducer`

```js
const reducer = createRPCReducer('foo', {
  start: (state, action) => {}, // optional,
  success: (state, action) => {}, // optional,
  failure: (state, action) => {}, // optional,
});
```

#### `createRPCReactors`

```js
const reactors = createRPCReactors('foo', {
  start: (state, action) => {}, // optional,
  success: (state, action) => {}, // optional,
  failure: (state, action) => {}, // optional,
});
```

#### `createRPCHandler`

```js
const handler = createRPCHandler({
  store, // required
  rpc, // required
  rpcId, // required
  actions: { // optional
    start: () => ({type: '', payload: ''})
    success: () => ({type: '', payload: ''})
    failure: () => ({type: '', payload: ''})
  },
  mapStateToParams: (state) => {}, // optional
  transformParams: (params) => {} // optional
});
await handler({some:'args'});
```
