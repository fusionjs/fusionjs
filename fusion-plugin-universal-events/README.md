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
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';

export default function() {
  const app = new App();
  app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.configure(FetchToken, window.fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.on('some-event', (payload) => {});
    events.on('some-scoped-event', (payload, ctx) => {});
    events.emit('some-event', {some: 'payload'});
    return (ctx, next) => {
      const scoped = events.from(ctx);
      scoped.on('some-scoped-event', (payload, ctx) => {});
      scoped.emit('some-scoped-event', {some: 'payload'});
    };
  });
  return app;
}
```

### UniversalEvents vs Standard Event Emitter

The `UniversalEvents` abstraction was designed to allow you to emit and react to events without worrying about whether you are on the server or the browser. It also provides the ability for observers to map event payloads to new ones. For example, you might want to add the some piece of context such as a session id to every event of a certain type. If you just want a standard event emitter, this might not be the package for you.

### Event transformation

It's possible to transform event data with a mapping function, for example to attach a timestamp to all actions of a type.

```js
events.map('user-action', payload => {
  return {...payload, time: new Date().getTime()};
});

events.on('user-action', payload => {
  console.log(payload); // logs {type: 'click', time: someTimestamp}
});

events.emit('user-action', {type: 'click'});
```

### Accessing `ctx`

Event mappers and handlers take an optional second parameter `ctx`. For example:

```js
events.on('type', (payload, ctx) => {
  //...
})
```

This parameter will be present when events are emitted from the `ctx` scoped EventsEmitter instance. For example:

```js
app.middleware({events: UniversalEventsToken}, ({events}) => {
  events.on('some-scoped-event', (payload, ctx) => {});
  return (ctx, next) => {
    const scoped = events.from(ctx);
    scoped.emit('some-scoped-event', {some: 'payload'});
  };
});
```

### * event type

`*` is a special event type which denotes all events. This allows you to add a mapper or handler to all events. For example:

```js
events.map('*', payload => {
  //
});
```

---

### API

#### Plugin registration

```js
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
app.register(UniversalEventsToken, UniversalEvents);
```

#### Dependencies

##### `FetchToken`

- `fetch` - UniversalEvents in the browser depends on an implementation of `fetch` registered on the standard `FetchToken` exported from `fusion-tokens`.

```js
import {FetchToken} from 'fetch-tokens';
__BROWSER__ && app.configure(FetchToken, window.fetch);

#### Instance API 

#### `events.on`

```js
events.on(type, callback)
```

Registers a callback to be called when an event of a type is emitted. Note that the callback will not be called if the event is emitted before the callback is registered.

- `type: string` - Required. The type of event to listen on
- `callback: (mappedPayload: Object, ctx?) => void` - Required. Runs when an event of matching type occurs. Receives the `payload` after it has been transformed by [mapper functions](#eventsmap), as well an optional ctx object.

#### `events.emit`

```js
events.emit(type, payload)
```

- `type: string` - Required. The type of event to emit
- `payload: Object` - Optional. Data to be passed to event handlers

#### `events.map`

```js
events.map(type, callback)
```

- `type: string` - Required. The type of event to listen on
- `callback: (payload: Object, ctx?) => Object` - Required. Runs when an event of matching type occurs. Should return a modified `payload`

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

Stops the interval timer, clears the data queue and prevents any further data from being flushed to the server. Useful for testing

#### `events.from`

```js
const scoped = events.from(ctx);
```

Returns a scoped version of the events api.

- `ctx: FusionContext` - Required. See [FusionContext](https://github.com/fusionjs/fusion-core#context)
