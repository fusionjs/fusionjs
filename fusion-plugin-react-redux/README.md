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
import Redux from 'fusion-plugin-react-redux';
import App from 'fusion-react';
import reducer from './reducer';
import enhancer from './enhancer';

export default function start() {
  const app = new App(root);
  app.plugin(Redux, {
    reducer,
    enhancer,
    async getInitialState(ctx) {
      return {};
    }
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

```js
app.plugin(ReactReduxPlugin, {reducer, preloadedState, enhancer, getInitialState})
```

Creates the redux store and integrates it into the Fusion application

- `reducer: (state: any, action: Object) => any` - required. The root reducer
- `preloadedState: any` - optional. Overrides the initial state in the server, and the hydrated state in the client
- `enhancer: (arg: any) => any` - optional. Enhances the store with 3rd party capabilities, such as middlewares, time travel, persistence, etc. If you're using `applyMiddleware`, pass it to this option (i.e `{enhancer: applyMiddleware(myMiddleware)}`). You can also compose multiple enhancers (e.g. `{enhancer: compose(applyMiddleware(myMiddleware), anotherEnhancer)`)
- `async getInitialState: (ctx) => Promise<any>` - optional. A function that returns the initial state for your redux store.

---

### Redux Devtools integration

The plugin automatically integrates with the [redux devtools Chrome extension](https://github.com/zalmoxisus/redux-devtools-extension)

---
