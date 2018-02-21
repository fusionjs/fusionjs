# fusion-plugin-rpc-redux-react

[![Build status](https://badge.buildkite.com/c16ece6ba0a81b30d11d69cb90b8f4d77a0967860144d12f44.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-rpc-redux-react)

Provides a higher order component that connects RPC methods to Redux as well as React component props

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
  * [Dependencies](#dependencies)
  * [`withRPCRedux`](#withrpcredux)
  * [`withRPCReactor`](#withrpcreactor)
  * [`mock`](#mock)
* [Other examples](#other-examples)

---

### Installation

```sh
yarn add fusion-plugin-rpc-redux-react
```

---

### Usage

```js
// src/redux/index.js
import {createRPCReducer} from 'fusion-plugin-rpc-redux-react';
export default createRPCReducer('increment', {
  start: (state, action) => ({count: state.count, loading: true, error: ''});
  success: (state, action) => ({count: action.payload.count, loading: false, error: ''});
  failure: (state, action) => ({count: state.count, loading: false, error: action.payload.error});
});

// src/rpc/index.js
export default {
  greet: async () => "hello",
}

// src/components/index.js
import React from 'react';
import {withRPCRedux} from 'fusion-plugin-rpc-redux-react';
import {connect} from 'react-redux';
import {compose} from 'redux';

function Example({greet, greeting, loading, error}) {
  return (
    <div>
      <button onClick={greet}>Greet</button>
      {loading && 'loading'}
      {error}
      {greeting}
    </div>
  );
}

const hoc = compose(
  withRPCRedux('greet'),
  connect(({greeting, loading, error}) => ({greeting, loading, error})),
);
export default hoc(Example);
```

---

### Setup

```js
// src/main.js
import App from 'fusion-react';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import Redux, {ReduxToken, ReducerToken} from 'fusion-plugin-react-redux';
import RPC, {RPCToken, RPCHandlersToken} from 'fusion-plugin-rpc-redux-react';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

import root from './components/index.js'
import reducer from './redux/index.js';
import handlers from './rpc/index.js';

export default () => {
  const app = new App(root);

  app.register(RPCToken, RPC);
  app.register(UniversalEventsToken, UniversalEvents);
  __NODE__
    ? app.register(RPCHandlersToken, handlers);
    : app.register(FetchToken, fetch);
  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
}
```

---

### API

#### Registration API

##### `RPC`

```js
import RPC from 'fusion-plugin-rpc-redux-react';
```

The plugin. Typically it should be registered to [`RPCToken`](#rpctoken). Installs an RPC provider at the root of the React tree.

###### `RPCToken`

```js
import {RPCToken} from 'fusion-plugin-rpc-redux-react';
```

The canonical token for the RPC plugin. Typically, it should be registered with the [RPC](#rpc) plugin.

#### Dependencies

##### `UniversalEventsToken`

Required. See [https://github.com/fusionjs/fusion-plugin-universal-events#api](https://github.com/fusionjs/fusion-plugin-universal-events#api)

##### `RPCHandlersToken`

```js
import {RPCHandlersToken} from 'fusion-plugin-rpc-redux-react';
```

Configures what RPC handlers exist. Required. Server-only.

###### Types

```flow
type RPCHandlers = Object<string, () => any>
```

You can register a value of type `RPCHandlers` or a Plugin that provides a value of type `RPCHandlers`.

##### `FetchToken`

Required. Browser-only. See [https://github.com/fusionjs/fusion-tokens#fetchtoken](https://github.com/fusionjs/fusion-tokens#fetchtoken)

##### `ReduxToken`

Required. See [https://github.com/fusionjs/fusion-plugin-react-redux](https://github.com/fusionjs/fusion-plugin-react-redux)

##### `ReducerToken`

Required. See [https://github.com/fusionjs/fusion-plugin-react-redux](https://github.com/fusionjs/fusion-plugin-react-redux)

---

#### `withRPCRedux`

```js
import {withRPCRedux} from 'fusion-plugin-rpc-redux-react';
```

Creates a higher order component with a prop mapped to the given RPC method. It can additionally configure the mapped method with parameters from state or from a transformation function.

```js
const hoc:HOC = withRPCRedux(rpcId: string, {
  propName: ?string,
  mapStateToParams: ?(state: any) => any,
  transformParams: ?(params: any) => any,
})
```

* `rpcId: string` - The name of the RPC method to expose in the component's props
* `propName: ?string` - Optional. The name of the prop. Defaults to the same as `rpcId`
* `mapStateToParams: ?(state: any) => any` - populate the RPC request with parameters from Redux state
* `transformParams: ?(params: any) => any` - transforms the params
* returns `hoc: Component => Component`

#### `withRPCReactor`

```js
import {withRPCReactor} from 'fusion-plugin-rpc-redux-react';
```

Creates a higher order component by colocating global reducers to the component

```js
const hoc:HOC = withRPCReactor(rpcId: string, {
  start: ?(state: any, action: Object) => any,
  success: ?(state: any, action: Object) => any,
  failure: ?(state: any, action: Object) => any,
}, {
  propName: ?string
  mapStateToParams: ?(state: any) => any,
  transformParams: ?(params: any) => any,
});
```

* `rpcId: string` - The name of the RPC method to expose in the component's props
* `start: ?(state: any, action: Object) => any` - A reducer to run when the RPC call is made
* `success: ?(state: any, action: Object) => any` - A reducer to run when the RPC call succeeds
* `failure: ?(state: any, action: Object) => any` - A reducer to run when the RPC call fails
* `propName: ?string` - Optional. The name of the prop. Defaults to the same as `rpcId`
* `mapStateToParams: ?(state: any) => any` - populate the RPC request with parameters from Redux state
* `transformParams: ?(params: any) => any` - transforms the params
* returns `hoc: Component => Component`

#### mock

```js
import {mock as MockRPC} from 'fusion-plugin-rpc-redux-react';
```

The package also exports a mock RPC plugin which can be useful for testing. For example:

```js
app.register(RPCToken, mock);
```

---

### Other examples

### Usage with Reactors

[`redux-reactors`](https://github.com/ganemone/redux-reactors) is a library that allows you to colocate Redux actions and reducers

The `fusion-plugin-rpc-redux-react` package provides a `withRPCReactor` HOC which facilitates implementing a Redux store using reactors.

To use it, register the `fusion-plugin-react-redux` plugin with `reactorEnhancer` from `redux-reactors`:

```js
// src/main.js
import App from 'fusion-react';
import Redux, {
  ReduxToken,
  ReducerToken,
  EnhancerToken
} from 'fusion-plugin-react-redux';
import RPC, {RPCToken, RPCHandlersToken} from 'fusion-plugin-rpc-redux-react';
import {FetchToken} from 'fusion-tokens';
import {reactorEnhancer} from 'redux-reactors';
import fetch from 'unfetch';

import reducer from './redux';
import handlers from './rpc';

export default () => {
  const app = new App();

  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
  app.register(EnhancerToken, reactorEnhancer);

  app.register(RPCToken, RPC);
  app.register(RPCHandlersToken, handlers);
  app.register(FetchToken, fetch);
  return app;
}

// src/rpc.js
export default {
  increment() {
    return db.query(/* ... */).then(n => ({count: n}));
  }
}
```

Because `redux-reactors` is implemented as a Redux enhancer, it doesn't require building reducers in the traditional Redux way. Thus, the root reducer can simply be the identity function:

```js
// src/redux.js
export default state => state;
```

Here's how to implement a reactor:

```js
// src/reactors/increment.js
import {withRPCReactor} from 'fusion-plugin-rpc-redux-react';

export const incrementReactor = withRPCReactor('increment', {
  start: (state, action) => ({count: state.count, loading: true, error: ''});
  success: (state, action) => ({count: action.payload.count, loading: false, error: ''});
  failure: (state, action) => ({count: state.count, loading: false, error: action.payload.error});
});
```

`incrementReactor: Component => Component` is a React HOC. It defines three actions: `start`, `success` and `failure`, which correspond to the respective statuses of a HTTP request.

In the example above, when `increment` is called, the `start` action is dispatched, which runs a reducer that sets `state.loading` to true, `state.error` to false and keeps `state.count` intact. If the request completes successfully, `state.loading` is set to false, and `state.count` is updated with a new value. Similarly, if the request fails, `state.error` is set.

In addition to defining action/reducer pairs, the `incrementReactor` HOC also maps RPC methods to React props.

Reactors typically need to be used in conjunction with `connect` from `react-redux`, in order to map state to React.

Below is an example of consuming the state and RPC methods that are made available from the Redux store and the RPC plugin.

```js
// src/components/example.js
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {incrementReactor} from './reactors/increment.js';

function Example({count, loading, error, increment}) {
  return (
    <div>
      <p>Count: {count}</p>
      <p>
        <button onClick={() => increment()}>Increment</button>
      </p>
      {loading && 'Loading...'}
      {error}
    </div>
  );
}

const hoc = compose(
  incrementReactor,
  connect(({count, loading, error}) => ({count, loading, error}))
);
export default hoc(Example);
```

### Differences between reactors and vanilla Redux

Redux colocates all valid actions in a respective "slot" in the state tree, and colocates the structuring of the state tree via helpers such as `combineReducers`. This means that a reducer can be unit tested by simply calling the reducer with one of the valid actions, without having any effect on any other state that might exist in the app. The downside is that if an action needs to modify multiple "slots" in the state tree, it can be tedious to find all transformations pertaining to any given action.

Another point worth mentioning is that with traditional reducers, it's possible to refactor the state tree in such a way that doesn't make any changes to reducers or components (albeit it does require changing the reducer composition chain as well as all relevant `mapStateToProps` functions).

Reactors, on the other hand, colocate a single reducer to a single action, so all state transformations pertaining to any given action are handled by a single function. This comes at the cost of flexibility: it's no longer possible to refactor the shape of the state tree without changing every affectd reducer, and it's also possible to affect unrelated parts of the state tree, for example missing properties due to an overly conservative object assignment.

However doing large refactors to the shape of the state tree isn't necessarily all that common and it's often more intuitive to see all possible state transformations for a given action in a single place. In addition to creating less boilerplate, this pattern leads to similarly intuitive tests that are also colocated by action.
