# fusion-plugin-react-redux

[![Build status](https://badge.buildkite.com/b1165dac1a1aea4fee2d97e52c74f5101efeed82f6907bb16c.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-react-redux?branch=master)

Integrates React and Redux to a FusionJS application

It handles creating your store, wrapping your element tree in a provider, and serializing/deserializing your store between server and client.

---

### Installation

```sh
yarn add fusion-plugin-react-redux
```

---

### Example

```js
// in your main.js file
import React from 'react';
import Redux, {ReduxToken, ReducerToken, EnhancerToken, InitialStateToken} from 'fusion-plugin-react-redux';
import ReduxActionEmitterEnhancer from 'fusion-plugin-redux-action-emitter-enhancer';
import App from 'fusion-react';
import reducer from './reducer';

export default function start() {
  const app = new App(root);
  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
  app.register(EnhancerToken, ReduxActionEmitterEnhancer);
  __NODE__ && app.register(InitialStateToken, async (ctx) => {
    return {};
  });

  return app;
}

// reducer.js file
export default (state, action) => {
  return state;
};
```

---

### API

#### Dependency registration

```js
import {
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  InitialStateToken
} from 'fusion-plugin-react-redux';

app.register(ReducerToken, reducer);
app.register(PreloadedStateToken, preloadedState);
app.register(EnhancerToken, enhancer);
__NODE__ && app.register(InitialStateToken, getInitialState);
```

Creates the redux store and integrates it into the FusionJS application.

##### Required dependencies

Name | Type | Description
-|-|-
`ReducerToken` | `(state: any, action: Object) => any` | The root reducer.

##### Optional dependencies

Name | Type | Default | Description
-|-|-|-
`PreloadedStateToken` | `any` | `undefined` | Overrides the initial state in the server, and the hydrated state in the client
`EnhancerToken` | `FusionPlugin` | `undefined` | Enhances the store with 3rd party capabilities, such as middlewares, time travel, persistence, etc. We are currently investigating enhancer composition in fusionjs/fusion-core#90, but for now you can use plugin aliasing for registering multiple enhancers: `app.register(EnhancerToken, ReduxActionEmitterEnhancer).alias(EnhancerToken, AnotherEnhancerPlugin);`.
`InitialStateToken` | `(ctx) => Promise<any>` | `undefined` | A function that returns the initial state for your redux store.  Server-side only.

#### Factory

`const redux = Redux.from(ctx);`

- `ctx: FusionContext` - Required. A [FusionJS Context](https://github.com/fusionjs/fusion-core#context).
- `redux: {initStore, store}`
  - `initStore: () => Promise<ReduxStore>` - Runs `getInitialState` and populates the store asynchronously.
  - `store: ReduxStore` - A [Redux store](https://redux.js.org/docs/api/Store.html)

---

### Redux Devtools integration

The plugin automatically integrates with the [redux devtools Chrome extension](https://github.com/zalmoxisus/redux-devtools-extension)

---

### `store.ctx` - Enhancers have access to `ctx`

For convenience, Redux stores are composed with a default right-most enhancer to add `store.ctx` along side with other [Store APIs](https://github.com/reactjs/redux/blob/master/docs/api/Store.md).
This is particular useful for your custom store enhancers to access to `ctx` for use-cases such as logging, analytics...etc.

See [redux-action-emitter-enhancer](https://github.com/fusionjs/fusion-plugin-redux-action-emitter-enhancer/) for an usage example.
