# fusion-react

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusion-react?branch=master)

Provides a Fusion.js application class that is pre-configured with React universal rendering.

The `App` class from this package should typically be used instead of `App` from [`fusion-core`](https://github.com/fusionjs/fusion-core) if you want React as the rendering engine, and you want it to be configured to do both server and client rendering.

---

# Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
  * [App](#app)
  * [Provider](#provider)
  * [ProviderPlugin](#providerplugin)
  * [ProvidedHOC](#providedhoc)
* [Examples](#examples)

---

### Installation

```sh
yarn add fusion-react
```

---

### Usage

```js
// ./src/main.js
import React from 'react';
import App from 'fusion-react';

const Hello = () => <div>Hello</div>;

export default function() {
  return new App(<Hello />);
}
```

---

### API

#### App

```js
import App from 'fusion-react';
```

A class that represents an application. An application is responsible for rendering (both virtual dom and server-side rendering). The functionality of an application is extended via [plugins](https://github.com/fusionjs/fusion-core#plugin).

**Constructor**

```flow
const app: App = new App(el: ReactElement, render: ?(el: ReactElement) => any);
```

* `el: ReactElement` - a template root. In a React application, this would be a React element created via `React.createElement` or a JSX expression.
* `render: ?Plugin<Render>|Render` - Optional. Defines how rendering should occur. A Plugin should provide a value of type `Render`
  * `type Render = (el:any) => any`

**app.register**

```flow
app.register(plugin: Plugin);
app.register(token: Token, plugin: Plugin);
app.register(token: Token, value: any);
```

Call this method to register a plugin or configuration value into a Fusion.js application.

You can optionally pass a token as the first argument to associate the plugin/value to the token, so that they can be referenced by other plugins within Fusion.js' dependency injection system.

* `plugin: Plugin` - a [Plugin](https://github.com/fusionjs/fusion-core#plugin) created via [`createPlugin`](https://github.com/fusionjs/fusion-core#createplugin)
* `token: Token` - a [Token](https://github.com/fusionjs/fusion-core#token) created via [`createToken`](https://github.com/fusionjs/fusion-core#createtoken)
* `value: any` - a configuration value
* returns `undefined`

**app.middleware**

```js
app.middleware((deps: Object<string, Token>), (deps: Object) => Middleware);
app.middleware((middleware: Middleware));
```

* `deps: Object<string,Token>` - A map of local dependency names to [DI tokens](https://github.com/fusionjs/fusion-core#token)
* `middleware: Middleare` - a [middleware](https://github.com/fusionjs/fusion-core#middleware)
* returns `undefined`

This method is a shortcut for registering middleware plugins. Typically, you should write middlewares as plugins so you can organize different middlewares into different files.

**app.enhance**

```flow
app.enhance(token: Token, value: any => Plugin | Value);
```

This method is useful for composing / enhancing functionality of existing tokens in the DI system.

**app.cleanup**

```js
await app.cleanup();
```

Calls all plugin cleanup methods. Useful for testing.

* returns `Promise`

---

#### Provider

**Provider.create**

```js
import {Provider} from 'fusion-react';
```

```flow
const ProviderComponent:React.Component = Provider.create(name: string);
```

* `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
* returns `ProviderComponent: React.Component` - A component that sets a context property on a class that extends BaseComponent

#### ProviderPlugin

```js
import {ProviderPlugin} from 'fusion-react';
```

Creates a plugin that wraps the React tree with a context provider component.

**ProviderPlugin.create**

```flow
const plugin:Plugin = ProviderPlugin.create(name: string, plugin: Plugin, ProviderComponent: React.Component);
```

* `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
* `plugin: Plugin` - Required. Creates a provider for this plugin.
* `ProviderComponent: React.Component` - Optional. An overriding provider component for custom logic
* `Plugin: Plugin` - A plugin that registers its provider onto the React tree

#### ProvidedHOC

```js
import {ProvidedHOC} from 'fusion-react';
```

Creates a HOC that exposes a value from React context to the component's props.

**ProvidedHOC.create**

```flow
const hoc:HOC = ProvidedHOC.create(name: string, mapProvidesToProps: Object => Object);
```

* `name: string` - Required. The name of the property set in `context` by the corresponding provider component.
* `mapProvidesToProps: Object => Object` - Optional. Defaults to `provides => ({[name]: provides})`. Determines what props are exposed by the HOC
* returns `hoc: Component => Component`

---

### Examples

#### Disabling server-side rendering

Sometimes it is desirable to avoid server-side rendering. To do that, override the `render` argument when instantiating `App`:

```js
// src/main.js
import App from 'fusion-react';
import ReactDOM from 'react-dom';

const render = __NODE__
  ? () => '<div id="root"></div>'
  : el => ReactDOM.render(el, document.getElementById('root'));
const app = new App(root, render);
```

#### Creating a Provider/HOC pair

```js
// in src/plugins/my-plugin.js
import {createPlugin} from 'fusion-core';

const plugin = createPlugin({
  provides() {
    return console;
  },
});

export const Plugin = ProviderPlugin.create('console', plugin);
export const HOC = ProvidedHOC.create('console');

// in src/main.js
import {Plugin} from './plugins/my-plugin.js';
app.register(Plugin);

// in components/some-component.js
const component = ({console}) => {
  return <button onClick={() => console.log('hello')}>Click me</button>;
};
export default HOC(component);
```
