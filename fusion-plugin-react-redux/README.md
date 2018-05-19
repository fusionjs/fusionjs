# fusion-plugin-react-redux

[![Build status](https://badge.buildkite.com/b1165dac1a1aea4fee2d97e52c74f5101efeed82f6907bb16c.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-react-redux?branch=master)

Integrates React and Redux to a Fusion.js application

It handles creating your store, wrapping your element tree in a provider, and serializing/deserializing your store between server and client.

Note that this plugin extends the Redux state with a property called `ctx` that references the request's [context](https://github.com/fusionjs/fusion-core#context)

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
  * [Dependencies](#dependencies)
  * [Service API](#service-api)
* [Redux devtools integration](#redux-devtools-integration)

---

### Installation

```sh
yarn add fusion-plugin-react-redux
```

---

### Usage

```js
// you can just use standard Redux reducers
export default (state, action) => ({
  count: countReducer(state.count, action),
  things: thingsReducer(state.things, action),
});

function countReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}

function thingsReducer(state, action) {
  switch (action.type) {
    case 'ADD_THING':
      return [...state, action.payload];
    default:
      return state;
  }
}
```

### Setup

```js
// in your main.js file
import React from 'react';
import Redux, {
  ReduxToken,
  ReducerToken,
  EnhancerToken,
  GetInitialStateToken,
} from 'fusion-plugin-react-redux';
import ReduxActionEmitterEnhancer from 'fusion-plugin-redux-action-emitter-enhancer';
import App from 'fusion-react';
import reducer from './reducer';

export default function start() {
  const app = new App(root);
  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
  app.register(EnhancerToken, enhancer);
  __NODE__ && app.register(GetInitialStateToken, async ctx => ({}));

  return app;
}
```

---

### API

#### Registration API

##### `Redux`

```js
import Redux from 'fusion-plugin-react-redux';
```

The Redux plugin. Provides the [service API](#service-api) and installs a redux provider at the top of the React tree. Typically it's registered to [`ReduxToken`](#reduxtoken)

##### `ReduxToken`

```js
import {ReduxToken} from 'fusion-plugin-react-redux';
```

Typically, it's registered with [`Redux`](#redux)

#### Dependencies

##### `ReducerToken`

```js
import {ReducerToken} from 'fusion-plugin-react-redux';
```

The root [reducer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#reducer). Required.

###### Types

```flow
type Reducer = (state: any, action: Object) => any
```

##### `EnhancerToken`

```js
import {ReducerToken} from 'fusion-plugin-react-redux';
```

Redux [enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer). Optional.

###### Types

```flow
type Enhancer = (next: StoreCreator) => StoreCreator
type StoreCreator = (reducer: Reducer, preloadedState: State) => Store
```

##### `GetInitialStateToken`

```js
import {GetInitialStateToken} from 'fusion-plugin-react-redux';
```

A function that gets initial state asynchronously without triggering actions. Optional. Useful for testing. When architecting application state, prefer using standard reducers to specify initial state.

###### Types

```flow
type InitialState = () => Promise<State> | State
```

---

#### Service API

```js
const service: ReduxServiceInstance = Redux.from((ctx: Context));
```

* `ctx: Context` - A [Fusion.js context](https://github.com/fusionjs/fusion-core#context)
* returns `service:ReduxServiceInstance`

###### Types

```flow
type ReduxServiceInstance = {
  ctx: Context,
  store: Store,
  initStore: () => Promise<Store>
}
```

* `ctx: Context` - A [Fusion.js context](https://github.com/fusionjs/fusion-core#context)
* `store: Store` - A Redux store
* `initStore: () => Promise<Store>` - calls the function provided by [`GetInitialStateToken`](#getinitialstatetoken)

###### `store.ctx`

For convenience, Redux stores are composed with a default right-most enhancer to add `store.ctx` along side with other [Store APIs](https://github.com/reactjs/redux/blob/master/docs/api/Store.md).
This is particular useful for your custom store enhancers to access to `ctx` for use-cases such as logging, analytics...etc.

See [redux-action-emitter-enhancer](https://github.com/fusionjs/fusion-redux-action-emitter-enhancer/) for an usage example.

---

### Redux devtools integration

The plugin automatically integrates with the [redux devtools Chrome extension](https://github.com/zalmoxisus/redux-devtools-extension)
