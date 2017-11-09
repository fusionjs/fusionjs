# fusion-plugin-universal-events

[![Build status](https://badge.buildkite.com/de4e30ddb9d019f5a8e3a2519bc0a5cccab25247809cd10c99.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-universal-events)

This is a [Fusion plugin](https://github.com/fusionjs/fusion-core) that captures events emitted from the client, sends them in batches to the server periodically, and allows the server to handle them.

It's useful for when you want to collect data about user actions or other metrics, and send them in bulk to the server to minimize the number of HTTP requests.

For convenience, `universal-events` automatically flushes its queue on page unload.

---

### Installation

```sh
yarn add fusion-plugin-universal-events
```

---

### Example

```js
// main.js
import React from 'react';
import App from 'fusion-react';
import universalEvents from 'fusion-plugin-universal-events';
import Root from './components/root';
import analytics from './plugins/analytics';

export default function() {
  const app = new App(<Root />);
  const UniversalEvents = app.plugin(universalEvents);
  const Analytics = app.plugin(analytics, {UniversalEvents});
  return app;
}

// components/root.js
export default ({}, {universalEvents}) => {
  function trackSignUp() {
    universalEvents.emit('user-action', {
      action: 'click',
      target: 'sign up button',
    });
  }
  return <button onClick={trackSignUp}>Sign up</button>;
}

// plugins/analytics.js
export default function({UniversalEvents}) => (ctx, next) => {
  UniversalEvents.of(ctx).on('user-action', ({action, target}) => {
    // logs `User did a click on sign up button` both in client and server
    console.log(`User did a ${action} on ${target}!`);
    if (__NODE__) {
      // save data
    }
  });
  return next();
}
```

### Event transformation

It's possible to transform event data with a mapping function, for example to attach a timestamp to all actions of a type.

```js
const events = UniversalEvents.of();
events.map('user-action', payload => {
  return {...payload, time: new Date().getTime()};
});

events.on('user-action', payload => {
  console.log(payload); // logs {type: 'click', time: someTimestamp}
});

events.emit('user-action', {type: 'click'});
```

---

### API

#### `universalEvents`

`universalEvents` - A plugin that creates a UniversalEvents class when passed to `app.plugin`

```js
import App from 'fusion-react';
import universalEvents from 'fusion-plugin-universal-events';

const UniversalEvents = app.plugin(universalEvents);
```

#### `UniversalEvents.of`

```js
const events = UniversalEvents.of(ctx)
```
Returns a singleton event emitter

- `ctx: Object` - A memoization key

#### `events.on`

```js
events.on(type, callback)
```

Registers a callback to be called when an event of a type is emitted. Note that the callback will not be called if the event is emitted before the callback is registered.

- `type: string` - Required. The type of event to listen on
- `callback: (mappedPayload: Object, ...args) => void` - Required. Runs when an event of matching type occurs. Receives the `payload` after it has been transformed by [mapper functions](#eventsmap), as well any other `args` that were originally passed to `.emit`

#### `events.emit`

```js
events.emit(type, payload, ...args)
```

- `type: string` - Required. The type of event to emit
- `payload: Object` - Optional. Data to be passed to event handlers
- `args: Array<any>` - Optional. Extra arguments to pass to `.map` and `.emit`

#### `events.map`

```js
events.map(type, callback)
```

- `type: string` - Required. The type of event to listen on
- `callback: (payload: Object, ...args) => Object` - Required. Runs when an event of matching type occurs. Should return a modified `payload`

#### `events.flush`

```js
events.flush()
```

Flushes the data queue to the server immediately. Does not affect flush frequency

#### `events.setFrequency`

```js
events.setFrequency(frequency)
```

Sets the frequency at which data is flushed to the server. Resets the interval timer.

- `frequency: number` - Required.

#### `events.teardown`

```js
events.teardown()
```

Stops the interval timer, clears the data queue and prevents any further data from being flushed to the server.
