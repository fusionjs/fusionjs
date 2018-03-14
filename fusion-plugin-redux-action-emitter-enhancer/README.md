# fusion-redux-action-emitter-enhancer

[![Build status](https://badge.buildkite.com/1864b671ca8edc1b7a6f8470ae320c6163268c23c4085ee82a.svg?branch=master)](https://buildkite.com/uberopensource/fusion-redux-action-emitter-enhancer)

Redux store enhancer that emits actions via an injected event emitter.

The `fusion-redux-action-emitter-enhancer` provides a Redux compatible [store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer).  This plugin composes a new, enhanced store creator, which captures and emits all dispatched actions.

This is useful for when you want to collect data about redux actions, potentially to recreate user journeys or statefulness.

---

### Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Capturing action emits](#capturing-action-emits)
- [Setup](#setup)
- [API](#api)
  - [Registration API](#registration-api)
    - [`ReduxActionEmitterEnhancer`](#reduxactionemitterenhancer)
    - [`EnhancerToken`](#enhancertoken)
  - [Dependencies](#dependencies)
  - [Service API](#service-api)
  - [Emit API](#emit-api)

---

### Installation

```js
yarn add fusion-redux-action-emitter-enhancer
```

---

### Usage

### Capturing action emits

We can register a simple callback to listen for the events emitted by this enhancer - in this case, `redux-action-emitter:action`.  Normally we might want to log these to a backend service, but for simplicity, we'll log them to console.

```js
// src/plugins/some-emit-consumer.js
export default createPlugin({
  deps: {events: UniversalEventsToken},
  middleware: ({events}) => {
    events.on('redux-action-emitter:action', payload => {
      console.log("Action emitted: ", payload);
    });
  }
});
```

---

### Setup

```js
// src/main.js
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import Redux, {ReduxToken, ReducerToken, EnhancerToken} from 'fusion-plugin-react-redux';
import fetch from 'unfetch';
import ReduxActionEmitterEnhancer from 'fusion-plugin-redux-action-emitter-enhancer';
import reducer from './reducers/root.js'

export default function start() {
  const app = new App(root);

  app.register(UniversalEventsToken, UniversalEvents, {fetch});
  __BROWSER__ && app.register(FetchToken, fetch);

  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
  app.register(EnhancerToken, ReduxActionEmitterEnhancer);

  return app;
}

// src/reducers/root.js
export default (state, action) => {
  // reducer goes here
}
```

---

### API

#### Registration API

##### `ReduxActionEmitterEnhancer`

```js
import ReduxActionEmitterEnhancer from 'fusion-redux-action-emitter-enhancer';
```

This plugin.  It can be registered as a dependency to any plugin that expects a Redux Store Enhancer.  Typically, it should be registered with [`EnhancerToken`](#enhancertoken).

##### `EnhancerToken`

```js
import {EnhancerToken} from 'fusion-plugin-react-redux';
```

If you are using [`fusion-plugin-react-redux`](https://github.com/fusionjs/fusion-plugin-react-redux), we recommend registering this plugin to the `EnhancerToken`.

#### Dependencies

```js
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';

app.register(UniversalEventsToken, UniversalEvents);
```

An event emitter plugin which emits the actions.  Typically, it is registered with [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusion-plugin-universal-events).

#### Service API

```js
type StoreEnhancer = (next: StoreCreator) => StoreCreator
```

This plugin provides a Redux compatible [store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer).

#### Emit API

To consume action events, add an event listener for the following emitted events:

- `redux-action-emitter:action`

The payload is the Redux action itself.
