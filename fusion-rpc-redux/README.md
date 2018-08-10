# fusion-rpc-redux

[![Build status](https://badge.buildkite.com/0a5101ffd6b6091e4d0066aa93b65b79a2e5f9141cb2b4316f.svg?branch=master)](https://buildkite.com/uberopensource/fusion-rpc-redux)

A collection of helper functions for working with Redux and RPC together

If using RPC from React components, you should use [`fusion-plugin-rpc-redux-react`](https://github.com/fusionjs/fusion-plugin-rpc-redux-react) instead of this package.

---

### Table of contents

* [Installation](#installation)
* [API](#api)
  * [`createRPCActions`](#createrpcactions)
  * [`createRPCReducer`](#createrpcreducer)

---

### Installation

```sh
yarn add fusion-rpc-redux
```

---

### API

#### `createRPCActions`

```js
import {createRPCActions} from 'fusion-rpc-redux';
```

Creates start, success and failure actions for an RPC method name. Basically, assuming a RPC method named `myMethod`, it lets you write `start({foo: 123})` instead of `{type: 'MY_METHOD_START', payload: {foo: 123}}`

##### Types

```js
const actions: Actions = createRPCActions((rpcId: string));
```

* `rpcId: string` - The RPC method name
* returns `actions: {start: (arg:T) => Action<T>, success: (arg:T) => Action<T>, failure: (T) => Action<T>}`

```js
type Action<T> = {
  type: string,
  payload: T,
};
```

For example, if `rpcId` is `doSomething`, `createRPCActions` generates the actions `DO_SOMETHING_START`, `DO_SOMETHING_SUCCESS`, and `DO_SOMETHING_FAILURE`.

#### `createRPCReducer`

```js
import {createRPCReducer} from 'fusion-rpc-redux';
```

Creates a reducer that is composed of reducers that respond to `start`, `success` and `failure` actions.

```js
const reducer: Reducer = createRPCReducer(rpcId: string, {
  start: ?Reducer,
  success: ?Reducer,
  failure: ?Reducer,
}, defaultValue: any);
```
