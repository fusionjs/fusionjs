# fusion-plugin-redux-action-emitter-enhancer

[![Build status](https://badge.buildkite.com/1864b671ca8edc1b7a6f8470ae320c6163268c23c4085ee82a.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-redux-action-emitter-enhancer)

Redux store enhancer that emits actions via an injected event emitter.

The `fusion-plugin-redux-action-emitter-enhancer` provides a Redux compatible [store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer).  This plugin composes a new, enhanced store creator, which captures and emits all dispatched actions.

This is useful for when you want to collect data about redux actions, potentially to recreate user journeys or statefulness.

---

### Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [Capturing action emits](#capturing-action-emits)
  - [Transforming action payloads on emission](#transforming-action-payloads-on-emission)
- [Setup](#setup)
- [API](#api)
  - [Registration API](#registration-api)
    - [`ReduxActionEmitterEnhancer`](#reduxactionemitterenhancer)
    - [`EnhancerToken`](#enhancertoken)
    - [`ActionEmitterTransformerToken`](#actionemittertransformertoken)
  - [Dependencies](#dependencies)
  - [Service API](#service-api)
  - [Emit API](#emit-api)

---

### Installation

```js
yarn add fusion-plugin-redux-action-emitter-enhancer
```

---

### Usage

#### Capturing action emits

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

#### Transforming action payloads on emission

This plugin depends on [fusion-plugin-universal-events](https://github.com/fusionjs/fusion-plugin-universal-events) to emit the action payloads, which means the payloads are sent over-the-wire to the server-side, which **can consume much of the network bandwidth**, or even cause 413 Payload Too Large HTTP errors. The dependence is the reason why by default the plugin will only emit [certain properties](#default-transformer) from the raw action payload.

By default, `_trackingMeta` is an opinionated property to be picked and emitted from the raw payload for tracking(analytics) purposes. **For customizations, you should provide a transformer function to mainly filter/pick properties for emission.**

```js
// src/app.js
import {ActionEmitterTransformerToken} from 'fusion-plugin-redux-action-emitter-enhancer';

app.register(ActionEmitterTransformerToken, action => {
  const base = {type: action.type};
  switch (action.type) {
    case 'ADD_TO_SHOPPING_CART':
    case 'REMOVE_FROM_SHOPPING_CART':
      return {
        ...base,
        items: action.payload.items,
      };
    case 'ADD_COUPON': {
      return {
        ...base,
        couponId: action.payload.couponId,
      };
    }
    case 'SUPER_BIG_PAYLOAD':
      return null; // !!Omit the action type from emission entirely!!
    default:
      return base;
  }
});
```

Or, if you are certain about emitting everything from the raw payload, maybe when bandwidth is actually not a concern for your application:

```js
app.register(ActionEmitterTransformerToken, action => action);
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
import ReduxActionEmitterEnhancer from 'fusion-plugin-redux-action-emitter-enhancer';
```

This plugin.  It can be registered as a dependency to any plugin that expects a Redux Store Enhancer.  Typically, it should be registered with [`EnhancerToken`](#enhancertoken).

##### `EnhancerToken`

```js
import {EnhancerToken} from 'fusion-plugin-react-redux';
```

If you are using [`fusion-plugin-react-redux`](https://github.com/fusionjs/fusion-plugin-react-redux), we recommend registering this plugin to the `EnhancerToken`.

##### `ActionEmitterTransformerToken`

```js
import {ActionEmitterTransformerToken} from 'fusion-plugin-redux-action-emitter-enhancer';
```
###### Default transformer
`action => ({type: action.type, _trackingMeta: action._trackingMeta})`

Providing a transform function for the raw action payloads. See ["Transforming action payloads on emission"](#transforming-action-payloads-on-emission) for more information.


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
