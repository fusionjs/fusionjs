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
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events-react';
import fetch from 'unfetch';
import {FetchToken} from 'fusion-tokens';

export default function() {
  const app = new App(root);
  app.register(FetchToken, fetch);
  app.register(UniversalEventsToken, UniversalEvents);
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

#### Dependency registration

```js
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events-react';
import {FetchToken} from 'fusion-tokens';

app.register(UniversalEventsToken, UniversalEvents);
__BROWSER__ && app.register(FetchToken, fetch);
```

##### Required dependencies

Name | Type | Description
-|-|-
`UniversalEventsToken` | `UniversalEvents` | An event emitter plugin, such as the one provided by [`fusion-plugin-universal-events`](https://github.com/fusionjs/fusion-plugin-universal-events).
`FetchToken` | `(url: string, options: Object) => Promise` | A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation.  Browser-only.

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
