# fusion-react

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Provides a Fusion.js application class that is pre-configured with React universal rendering.

The `App` class from this package should typically be used instead of `App` from [`fusion-core`](https://github.com/fusionjs/fusionjs/tree/master/fusion-core) if you want React as the rendering engine, and you want it to be configured to do both server and client rendering.

This package allows you to have deeply nested components with asynchronous dependencies and have everything just work with server-side rendering.

The typical use-case is when a deeply-nested component needs to have a resource fetched from a remote HTTP server, such as GraphQL or REST API. Since `renderToString` is synchronous, when you call it on your app, this component won't render correctly.

One solution is to have a central router at the root of your application that knows exactly what data needs to be fetched before rendering. But this solution doesn't fit the component-based architecture of a typical React app. You want to declare data dependencies at the component level, much like your declare your props.

This is exactly what `fusion-react` does: it allows you to declare asynchronous dependencies at the component level, and make them work fine with server-side rendering as well as client-side rendering.

If an application grows too much in size, one way to help reduce the size of the initial download is to split parts of the application into separate bundles and download those only when they are needed. This technique is known
as bundle splitting and `fusion-react` provides tools to do it easily.

---

# Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [App](#app)
  - [useService](#useservice)
  - [ServiceConsumer](#serviceconsumer)
  - [FusionContext](#fusioncontext)
  - [withServices](#withservices)
  - [split](#split)
  - [prepare](#prepare)
  - [prepared](#prepared)
  - [exclude](#exclude)
  - [SkipPrepareToken](#skippreparetoken)
  - [Provider - DEPRECATED](#provider)
  - [ProviderPlugin - DEPRECATED](#providerplugin)
  - [ProvidedHOC - DEPRECATED](#providedhoc)
- [Examples](#examples)

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

A class that represents an application. An application is responsible for rendering (both virtual dom and server-side rendering). The functionality of an application is extended via [plugins](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#plugin).

**Constructor**

```js
const app: App = new App(
  (el: ReactElement),
  (render: ?(el: ReactElement, ctx: Context) => any)
);
```

- `el: ReactElement` - a template root. In a React application, this would be a React element created via `React.createElement` or a JSX expression.
- `render: ?Plugin<Render>|Render` - Optional. Defines how rendering should occur. A Plugin should provide a value of type `Render`
  - `type Render = (el:ReactComponent, ctx: Context) => any`


**app.register**

```js
app.register((plugin: Plugin));
app.register((token: Token), (plugin: Plugin));
app.register((token: Token), (value: any));
```

Call this method to register a plugin or configuration value into a Fusion.js application.

You can optionally pass a token as the first argument to associate the plugin/value to the token, so that they can be referenced by other plugins within Fusion.js' dependency injection system.

- `plugin: Plugin` - a [Plugin](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#plugin) created via [`createPlugin`](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#createplugin)
- `token: Token` - a [Token](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#token) created via [`createToken`](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#createtoken)
- `value: any` - a configuration value
- returns `undefined`

**app.middleware**

```js
app.middleware((deps: Object<string, Token>), (deps: Object) => Middleware);
app.middleware((middleware: Middleware));
```

- `deps: Object<string,Token>` - A map of local dependency names to [DI tokens](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#token)
- `middleware: Middleare` - a [middleware](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#middleware)
- returns `undefined`

This method is a shortcut for registering middleware plugins. Typically, you should write middlewares as plugins so you can organize different middlewares into different files.

**app.enhance**

```js
app.enhance((token: Token), (value: any => Plugin | Value));
```

This method is useful for composing / enhancing functionality of existing tokens in the DI system.

**app.cleanup**

```js
await app.cleanup();
```

Calls all plugin cleanup methods. Useful for testing.

- returns `Promise`

---

#### useService

*React Hooks were introduced in React v16.8. Make sure you are using a compatible version.*

```js
import {useService} from 'fusion-react';
import {ExampleToken} from 'fusion-tokens';

function Component() {
  const service = useService(ExampleToken);
  return (
    <button onClick={service}>Invoke Service</button>
  );
}
```

- `token: Token<TService>` - Required. The token used to look up the registered plugin that resolves to `TService`.
- `service: TService` - The service provided by the registered plugin.

If no plugin has been registered to this token, an exception is thrown. If you intend you use an optional Token, you can suppress this exception by using `useService(Token.optional)`.

#### ServiceConsumer

```js
import {ServiceConsumer} from 'fusion-react';
import {ExampleToken} from 'fusion-tokens';

function Component() {
  return (
    <ServiceConsumer token={ExampleToken}>
      {service => (
        <button onClick={service}>Invoke Service</button>
      )}
    </ServiceConsumer>
  );
}
```

- `token: Token<TService>` - Required. The token used to lookup the registered plugin.
- `children: TService => React.Element<any>` - Required. Render prop that is passed the registered service. Should return the React Element to render.
- `service: TService` - The service provided by the registered plugin.

This is the same pattern as the `useService` hook. Opt for using the hook. `ServiceConsumer` is provided as a replacement for any legacy Context usage that may exist. Use `Token.optional` to if you intend to use an optional plugin.

#### FusionContext

```js
import {useContext} from 'react';
import {FusionContext} from 'fusion-react';

function Component() {
  const ctx = useContext(FusionContext);
  // ...
}
```

- `ctx: Context` The Fusion middleware context for this request. Instance of `React.createContext()`

FusionContext is provided in the case where a plugin may be memoized based on request, i.e.:

```js
const session = Session.from(ctx);
```

In this case, you will need to not only use `useService` to get the service you are interested in, but you will also have to get the FusionContext to pass into your service.

#### withServices

```js
import {withServices} from 'fusion-react';
import {ExampleToken} from 'fusion-tokens';

function Component({exampleProp}) {
  return (
    <h1>{exampleProp}</h1>
  );
}

export default withServices(
  {
    example: ExampleToken,
  },
  deps => ({ exampleProp: deps.example }),
)(Component);
```

- `deps: {[string]: Token<TService>}` - Required. Object whose values are Tokens.
- `mapServicesToProps: {[string]: TService} => {[string]: any}` - Optional. Function receives an object whose values are resolved services and returns an object to spread as props to a component. If omitted, the deps object is returned as-is.
- `HOC: Component => Component` - An HOC is returned that passes the result of `mapServicesToProps` to it's Component argument.

`withServices` is a generic HOC creator that takes a set of Tokens and an optional mapping function and returns a higher-order component that will pass the resolved services into the given Component.

#### split

```js
import {split} from 'fusion-react';

const Component = split({load, LoadingComponent, ErrorComponent});
```
- `load: () => Promise` - Required. Load a component asynchronously. Typically, this should make a dynamic `import()` call.
  The Fusion compiler takes care of bundling the appropriate code and de-duplicating dependencies. The argument to `import` should be a string literal (not a variable). See [webpack docs](https://webpack.js.org/api/module-methods/#import-) for more information.
- `LoadingComponent` - Required. A component to be displayed while the asynchronous component hasn't downloaded
- `ErrorComponent` - Required. A component to be displayed if the asynchronous component could not be loaded
- `defer: boolean` - Defaults to false. If `defer` is false split bundle is also rendered on the server.

#### prepare

```js
import {prepare} from 'fusion-react';

const Component = prepare(element);
```

- `Element: React.Element` - Required. A React element created via `React.createElement`
- `Component: React.Component` - A React component

Typically, you shouldn't need to call prepare yourself, if you're using `App` from `fusion-react`. The only time you might need to call it is if you imported `App` from `fusion-core` to implement a custom Application class.

The `prepare` function recursively traverses the element rendering tree and awaits the side effects of components decorated with `prepared` (or `dispatched`).

It should be used (and `await`-ed) _before_ calling `renderToString` on the server. If any of the side effects throws, `prepare` will also throw.

Timing information will be collected in `ctx.timing.prepass` - the number of prepasses required as well as the duration of each prepass.

#### prepared

```js
import {prepared} from 'fusion-react';

const hoc = prepared(sideEffect, opts);
```

- `sideEffect: (props: Object, context: Object) => Promise` - Required. When `prepare` is called, `sideEffect` is called (and awaited) before continuing the rendering traversal.
- `opts: {defer, boundary, componentDidMount, componentWillReceiveProps, componentDidUpdate, forceUpdate, contextTypes}` - Optional
  - `defer: boolean` - Optional. Defaults to `false`. If the component is deferred, skip the prepare step.
  - `boundary: boolean` - Optional. Defaults to `false`. Stop traversing if the component is defer or boundary.
  - `componentDidMount: boolean` - Optional. Defaults to `true`. On the browser, `sideEffect` is called when the component is mounted.
  - [TO BE DEPRECATED] `componentWillReceiveProps: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again whenever the component receive props.
  - `componentDidUpdate: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again right after updating occurs.
  - `forceUpdate: boolean` - Optional. Defaults to `false`.
  - `contextTypes: Object` - Optional. Custom React context types to add to the prepared component.
- `hoc: (Component: React.Component) => React.Component` - A higher-order component that returns a component that awaits for async side effects before rendering.
  - `Component: React.Component` - Required.

##### Prepared component props

- `effectId: string` - Used to enable `effectFn` to be called multiple times when rendering the same component.

```js

const PreparedComponent = prepared(effectFn)(SomeComponent);

// effectFn called only once
const app1 = (
  <div>
    <PreparedComponent />
    <PreparedComponent />
    <PreparedComponent />
  </div>
)

// effectFn called for each rendered PreparedComponent
const app2 = (
  <div>
    <PreparedComponent effectId="1" />
    <PreparedComponent effectId="2" />
    <PreparedComponent effectId="3" />
  </div>
)
```

#### exclude

```js
import {exclude} from 'fusion-react';

const NewComponent = exclude(Component);
```

- `Component: React.Component` - Required. A component that should not be traversed via `prepare`.
- `NewComponent: React.Component` - A component that is excluded from `prepare` traversal.

Stops `prepare` traversal at `Component`. Useful for optimizing the `prepare` traversal to visit the minimum number of nodes.

#### SkipPrepareToken

```js
import {SkipPrepareToken} from 'fusion-react';

app.register(SkipPrepareToken, true);
```

Skips the prepare render of the application, which is responsible for running side effects in `prepared` statements.

#### Provider

**[DEPRECATED]** When using `useService`, `ServiceConsumer`, or `withServices` it is no longer necessary to add a `Provider` to your application. Services are made available through a generic `Context` instance in the `fusion-react` app class.

**Provider.create**

```js
import {Provider} from 'fusion-react';
```

```js
const ProviderComponent: React.Component = Provider.create((name: string));
```

- `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
- returns `ProviderComponent: React.Component` - A component that sets a context property on a class that extends BaseComponent

#### ProviderPlugin

**[DEPRECATED]** When using `useService`, `ServiceConsumer`, or `withServices` it is no longer necessary to register a `ProviderPlugin` in place of a `Plugin`. This is handled within the `fusion-react` app class.

```js
import {ProviderPlugin} from 'fusion-react';
```

Creates a plugin that wraps the React tree with a context provider component.

**ProviderPlugin.create**

```js
const plugin: Plugin = ProviderPlugin.create(
  (name: string),
  (plugin: Plugin),
  (ProviderComponent: React.Component)
);
```

- `name: string` - Required. The name of the property set in `context` by the provider component. `name` is also used to generate the `displayName` of `ProviderComponent`, e.g. if `name` is `foo`, `ProviderComponent.displayName` becomes `FooProvider`
- `plugin: Plugin` - Required. Creates a provider for this plugin.
- `ProviderComponent: React.Component` - Optional. An overriding provider component for custom logic
- `Plugin: Plugin` - A plugin that registers its provider onto the React tree

#### ProvidedHOC

**[DEPRECATED]** See [`withServices`](#withservices) for a generic HOC. For applications still using `ProvidedHOC`, note that this will work without registering a `ProviderPlugin` to wrap your `Plugin`, but it is recommended to migrate to using `useService`, `ServiceConsumer`, or `withServices` instead.

```js
import {ProvidedHOC} from 'fusion-react';
```

Creates a HOC that exposes a value from React context to the component's props.

**ProvidedHOC.create**

```js
const hoc: HOC = ProvidedHOC.create(
  (name: string),
  (mapProvidesToProps: Object => Object)
);
```

- `name: string` - Required. The name of the property set in `context` by the corresponding provider component.
- `mapProvidesToProps: Object => Object` - Optional. Defaults to `provides => ({[name]: provides})`. Determines what props are exposed by the HOC.
- `token: Token<TService>` - Optional. By supplying a token, the HOC will return a component that uses the `useService` hook instead of the legacy Context API.
- returns `hoc: Component => Component`

---

### Examples

#### Using a service

```js
// src/plugins/my-plugin.js
import {createPlugin, createToken} from 'fusion-core';

export const MyToken = createToken('my-token');
export const MyPlugin = createPlugin({
  provides() {
    return console;
  },
});

// src/main.js
import {MyPlugin, MyToken} from './plugins/my-plugin.js';

export default (app: FusionApp) => {
  app.register(MyToken, MyPlugin);
  // ...
};

// components/some-component.js
import {MyToken} from '../plugins/my-plugin.js';
import {useService} from 'fusion-react';

exoprt default Component (props) {
  const console = useService(MyToken);
  return (
    <button onClick={() => console.log('hello')}>Click me</button>
  );
}
```

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
