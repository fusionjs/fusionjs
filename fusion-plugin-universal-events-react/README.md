# fusion-plugin-universal-events-react

[![Build status](https://badge.buildkite.com/eb8bd80c4893a29521d5f7070f73a199ab8e941ae422adb4b8.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-universal-events-react)

React Provider and HOC for [Fusion universal-events](https://github.com/fusionjs/fusion-plugin-universal-events)

---

### Installation

```sh
yarn add fusion-plugin-universal-events-react
```

---

### Example

```js
// main.js
import App from 'fusion-react';
import universalEvents from 'fusion-plugin-universal-events-react';
import fetch from 'unfetch';

export default function() {
  const app = new App(root);
  const EventEmitter = app.plugin(universalEvents, {fetch});
  return app;
}

// components/component.js
import {withBatchEvents} from 'fusion-plugin-universal-events-react';

const Component = ({universalEvents}) => {
  universalEvents.on('foo', payload => {console.log(payload)});
};

export default withBatchEvents(Component);
```

---

### API

#### plugin

```js
// main.js
import App from 'fusion-react';
import UniversalEvents from 'fusion-plugin-universal-events-react';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

export default function() {
  const app = new App(root);
  const EventEmitter = app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.configure(FetchToken, fetch);
  return app;
}
```

#### `withBatchEvents`

```js
import {withBatchEvents} from 'fusion-plugin-universal-events-react';

const Component = ({universalEvents}) => {
  universalEvents.on('foo', payload => {
    console.log(payload);
  });
};

export default withBatchEvents(Component);
```
