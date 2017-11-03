# fusion-react

FusionJS entry point for React universal rendering

---

### Installation

```sh
yarn add fusion-react
```

---

### Example

```js
// ./src/main.js
import React from 'react';
import App from 'fusion-react';

const Hello = () => <div>Hello</div>

export default function() {
  return new App(<Hello />);
}
```

---

### API

```js
const app = new App(element);
```

`app` should be returned by the default exported function of `./src/main.js`

- `element: React.Element` - The root React element for the app

#### Instance methods

```js
const plugin = app.plugin(factory, dependencies)
```

- `factory: (dependencies: Object) => Plugin` - Required. The export value of a plugin package
- `dependencies: Object` - Optional. A map of dependencies for the plugin
- `plugin: Plugin` - A Fusion [plugin](../core#plugin-api)
