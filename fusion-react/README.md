# fusion-react

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusion-react?branch=master)


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
import App from 'fusion-react';

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

### Provider

#### create

```js
import {Provider} from 'fusion-react';

const ProviderComponent = Provider.create(name, BaseComponent)
```

- `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
- `BaseComponent: React.Component` - Optional. Defaults to `React.Component`. The component class to extend from.
- `ProviderComponent: React.Component` - A component that sets a context property on a class that extends BaseComponent

#### ProviderPlugin

```js
import {ProviderPlugin} from 'fusion-react';

const Plugin = ProviderPlugin.create(name, plugin, BaseComponent)
```

- `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
- `plugin: Plugin` - Required. Creates a provider for this plugin.
- `BaseComponent: React.Component` - Optional. Defaults to `React.Component`. The component class to extend from.
- `Plugin: Plugin` - A plugin that registers its provider onto the React tree

#### ProvidedHOC

```js
import {ProvidedHOC} from 'fusion-react';

const hoc = ProvidedHOC.create(name, mapServiceToProps)
```

- `name: string` - Required. The name of the property set in `context` by the corresponding provider component.
- `mapServiceToProps: Object => Object` - Optional. Defaults to `service => ({[name]: service})`. Determines what props are exposed by the HOC
