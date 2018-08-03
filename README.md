# fusion-react

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusion-react?branch=master)

Provides a Fusion.js application class that is pre-configured with React universal rendering.

The `App` class from this package should typically be used instead of `App` from [`fusion-core`](https://github.com/fusionjs/fusion-core) if you want React as the rendering engine, and you want it to be configured to do both server and client rendering.

This package allows you to have deeply nested components with asynchronous dependencies and have everything just work with server-side rendering.

The typical use-case is when a deeply-nested component needs to have a resource fetched from a remote HTTP server, such as GraphQL or REST API. Since `renderToString` is synchronous, when you call it on your app, this component won't render correctly.

One solution is to have a central router at the root of your application that knows exactly what data needs to be fetched before rendering. But this solution doesn't fit the component-based architecture of a typical React app. You want to declare data dependencies at the component level, much like your declare your props.

This is exactly what `fusion-react` does: it allows you to declare asynchronous dependencies at the component level, and make them work fine with server-side rendering as well as client-side rendering.

If an application grows too much in size, one way to help reduce the size of the initial download is to split parts of the application into separate bundles and download those only when they are needed. This technique is known
as bundle splitting and `fusion-react` provides tools to do it easily.

---

# Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
  * [App](#app)
  * [Provider](#provider)
  * [ProviderPlugin](#providerplugin)
  * [ProvidedHOC](#providedhoc)
  * [middleware](#middleware)
  * [split](#split)
  * [prepare](#prepare)
  * [prepared](#prepared)
  * [exclude](#exclude)
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
import React from "react";
import App from "fusion-react";

const Hello = () => <div>Hello</div>;

export default function() {
  return new App(<Hello />);
}
```

---

### API

#### App

```js
import App from "fusion-react";
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
import {Provider} from "fusion-react";
```

```flow
const ProviderComponent:React.Component = Provider.create(name: string);
```

* `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
* returns `ProviderComponent: React.Component` - A component that sets a context property on a class that extends BaseComponent

#### ProviderPlugin

```js
import {ProviderPlugin} from "fusion-react";
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
import {ProvidedHOC} from "fusion-react";
```

Creates a HOC that exposes a value from React context to the component's props.

**ProvidedHOC.create**

```flow
const hoc:HOC = ProvidedHOC.create(name: string, mapProvidesToProps: Object => Object);
```

* `name: string` - Required. The name of the property set in `context` by the corresponding provider component.
* `mapProvidesToProps: Object => Object` - Optional. Defaults to `provides => ({[name]: provides})`. Determines what props are exposed by the HOC
* returns `hoc: Component => Component`

#### middleware

```js
import {middleware} from "fusion-react";
```

A middleware that adds a `PrepareProvider` to the React tree.

Consider using [`fusion-react`](https://github.com/fusionjs/fusion-react) instead of setting up React and registering this middleware manually, since that package does all of that for you.

#### split

```js
import {split} from "fusion-react-async";

const Component = split({load, LoadingComponent, ErrorComponent});
```

* `load: () => Promise` - Required. Load a component asynchronously. Typically, this should make a dynamic `import()` call.
  The Fusion compiler takes care of bundling the appropriate code and de-duplicating dependencies. The argument to `import` should be a string literal (not a variable). See [webpack docs](https://webpack.js.org/api/module-methods/#import-) for more information.
* `LoadingComponent` - Required. A component to be displayed while the asynchronous component hasn't downloaded
* `ErrorComponent` - Required. A component to be displayed if the asynchronous component could not be loaded
* `Component` - A placeholder component that can be used in your view which will show the asynchronous component

#### prepare

```js
import {prepare} from "fusion-react";

const Component = prepare(element);
```

* `Element: React.Element` - Required. A React element created via `React.createElement`
* `Component: React.Component` - A React component

Consider using [`fusion-react`](https://github.com/fusionjs/fusion-react) instead of setting up React manually and calling `prepare` directly, since that package does all of that for you.

The `prepare` function recursively traverses the element rendering tree and awaits the side effects of components decorated with `prepared` (or `dispatched`).

It should be used (and `await`-ed) _before_ calling `renderToString` on the server. If any of the side effects throws, `prepare` will also throw.

#### prepared

```js
import {prepared} from "fusion-react";

const hoc = prepared(sideEffect, opts);
```

* `sideEffect: (props: Object, context: Object) => Promise` - Required. When `prepare` is called, `sideEffect` is called (and awaited) before continuing the rendering traversal.
* `opts: {defer, boundary, componentDidMount, componentWillReceiveProps, componentDidUpdate, forceUpdate, contextTypes}` - Optional
  * `defer: boolean` - Optional. Defaults to `false`. If the component is deferred, skip the prepare step.
  * `boundary: boolean` - Optional. Defaults to `false`. Stop traversing if the component is defer or boundary.
  * `componentDidMount: boolean` - Optional. Defaults to `true`. On the browser, `sideEffect` is called when the component is mounted.
  * [TO BE DEPRECATED] `componentWillReceiveProps: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again whenever the component receive props.
  * `componentDidUpdate: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again right after updating occurs.
  * `forceUpdate: boolean` - Optional. Defaults to `false`.
  * `contextTypes: Object` - Optional. Custom React context types to add to the prepared component.
* `hoc: (Component: React.Component) => React.Component` - A higher-order component that returns a component that awaits for async side effects before rendering.
  * `Component: React.Component` - Required.

#### exclude

```js
import {exclude} from "fusion-react";

const NewComponent = exclude(Component);
```

* `Component: React.Component` - Required. A component that should not be traversed via `prepare`.
* `NewComponent: React.Component` - A component that is excluded from `prepare` traversal.

Stops `prepare` traversal at `Component`. Useful for optimizing the `prepare` traversal to visit the minimum number of nodes.

---

### Examples

#### Disabling server-side rendering

Sometimes it is desirable to avoid server-side rendering. To do that, override the `render` argument when instantiating `App`:

```js
// src/main.js
import App from "fusion-react";
import ReactDOM from "react-dom";

const render = __NODE__
  ? () => '<div id="root"></div>'
  : el => ReactDOM.render(el, document.getElementById("root"));
const app = new App(root, render);
```

#### Creating a Provider/HOC pair

```js
// in src/plugins/my-plugin.js
import {createPlugin} from "fusion-core";

const plugin = createPlugin({
  provides() {
    return console;
  }
});

export const Plugin = ProviderPlugin.create("console", plugin);
export const HOC = ProvidedHOC.create("console");

// in src/main.js
import {Plugin} from "./plugins/my-plugin.js";
app.register(Plugin);

// in components/some-component.js
const component = ({console}) => {
  return <button onClick={() => console.log("hello")}>Click me</button>;
};
export default HOC(component);
```

#### Data fetching

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Example from './components/example';
import UserAPI from './api'

export default () => {
  const app = new App(<Example />);

  app.register(UserAPI);

  return app;
}

// src/components/example.js
import {prepared} from 'fusion-react';

function Example({name}) {
  return <div>Hello, {name}</div>;
}

export default prepared(() => fetch('/api/user/1'))(Example);

// src/api.js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      if (ctx.path === '/api/user/1') {
        ctx.body = {name: 'Bob'};
      }
      return next();
    };
  }
});
```

#### Bundle splitting

```js
// src/main.js
import App from 'fusion-react';
import root from './components/root';

export default () => {
  return new App(root);
}

// src/components/root.js
import React from 'react';
import {split} from 'fusion-react';

const LoadingComponent = () => <div>Loading...</div>;
const ErrorComponent = () => <div>Error loading component</div>;
const BundleSplit = split({
  load: () => import('./components/hello');
  LoadingComponent,
  ErrorComponent
});

const root = (
  <div>
    <div>This is part of the initial bundle</div>
    <BundleSplit />
  </div>
)

export default root;

// src/components/hello.js
export default () => (
  <div>
    This is part of a separate bundle that gets loaded asynchronously
    when the BundleSplit component gets mounted
  </div>
)
```
