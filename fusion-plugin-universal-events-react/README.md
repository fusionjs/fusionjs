# fusion-plugin-universal-events-react

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
import universalEvents from 'fusion-plugin-universal-events-react';
import fetch from 'unfetch';

export default function() {
  const app = new App(root);
  const EventEmitter = app.plugin(universalEvents, {fetch});
  return app;
}

```

#### `withBatchEvents`

```js
import {withBatchEvents} from 'fusion-plugin-universal-events-react';

const Component = ({universalEvents}) => {
  universalEvents.on('foo', payload => {console.log(payload)});
};

export default withBatchEvents(Component);

```
