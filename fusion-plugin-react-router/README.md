# fusion-plugin-react-router

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The `fusion-plugin-react-router` package provides a universal router plugin for React. The plugin automatically configures a router provider to account for route prefix, routing events, hydration in bundle splitting scenarios, etc.

The package also offers components to control HTTP status server-side.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
  * [Routing Events and Timing Metrics](#routing-events-and-timing-metrics)
  * [`Router`](#router)
  * [`Route`](#route)
  * [`Link`](#link)
  * [`Switch`](#switch)
  * [`Status`](#status)
  * [`NotFound`](#notfound)
  * [`Redirect`](#redirect)
  * [`BrowserRouter`](#browserrouter)
  * [`HashRouter`](#hashrouter)
  * [`MemoryRouter`](#memoryrouter)
  * [`withRouter`](#withrouter)
  * [`matchPath`](#matchpath)

---

### Installation

```sh
yarn add fusion-plugin-react-router
```

---

### Usage

```js
// src/components/root.js
import React from 'react';
import {
  Router,
  Route,
  Link,
  Switch,
  NotFound,
} from 'fusion-plugin-react-router';

const Home = () => <div>Hello</div>;
const Test = () => <div>Test</div>;
const PageNotFound = () => (
  <NotFound>
    <div>404</div>
  </NotFound>
);

const root = (
  <div>
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/test">Test</Link>
      </li>
      <li>
        <Link to="/404">404</Link>
      </li>
    </ul>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/test" component={Test} />
      <Route component={PageNotFound} />
    </Switch>
  </div>
);
export default root;
```

---

### Setup

```jsx
// src/main.js
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import root from './components/root';

export default function start(App) {
  const app = new App(root);
  app.register(Router);
  app.register(UniversalEventsToken, UniversalEvents);
  return app;
}
```

---

### API

#### Registration API

##### Plugin

```js
import Router from 'fusion-plugin-react-router';
```

The plugin.

##### `RouterToken`

```jsx
import {RouterToken} from 'fusion-plugin-react-router';
```

A token for registering the router plugin on. You only need to register the plugin on this token if another
plugin depends on receiving the history object.

##### `RouterProviderToken`

```jsx
import {RouterProviderToken} from 'fusion-plugin-react-router';
```

An optional dependency of this plugin, used to replace the routing provider. Defaults to `import {Router} from react-router-dom`.
This is necessary for integrating with `connected-react-router`.

##### `UniversalEventsToken`

```jsx
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
```

The [universal events](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events) plugin. Optional.

Provide the UniversalEventsToken when you would like to emit routing events for data collection.


---

#### Routing Events and Timing Metrics

Router will emit the following events/metrics via the [universal events](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events) plugin if provided:

##### Server-side routing metrics via events
* `'pageview:server'`
  - `page: string` - (1)The path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (2)`ctx.path`.
  - `title: string` - (1)`props.trackingId` provided by [`<Route>`](#route), or (2)the path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (3)`ctx.path`.
  - `status: number` - HTTP status of the response
  - `timing: number` - Milliseconds. The time since the request received till routed by this plugin.
* `'render:server'`
  - `page: string` - (1)The path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (2)`ctx.path`.
  - `title: string` - (1)`props.trackingId` provided by [`<Route>`](#route), or (2)the path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (3)`ctx.path`.
  - `status: number` - HTTP status of the response
  - `timing: number` - Milliseconds. The execution time of [renderer](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#app).

##### Browser routing events
* `'pageview:browser'`
  - `page: string` - (1)The path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (2)`ctx.path`.
  - `title: string` - (1)`props.trackingId` provided by [`<Route>`](#route), or (2)the path of an [exact match](https://reacttraining.com/react-router/web/api/match), or (3)`ctx.path`.

---

#### Accessing History

This plugin provides an API to access the history object.

```js
import {createPlugin} from 'fusion-core';
import RouterPlugin, {RouterToken} from 'fusion-plugin-react-router';

app.register(RouterToken, RouterPlugin);
app.register(createPlugin({
  deps: {
    router: RouterToken,
  },
  middleware: ({router}) => (ctx, next) => {
    const {history} = router.from(ctx);
    // ...
    return next();
  }
}));
```

#### Router

Configures a router and acts as a React context provider for routing concerns. The plugin already provides `<Router>` in the middleware for your application.

```jsx
import {Router} from 'fusion-plugin-react-router';

<Router
  location={...}
  basename={...}
  context={...}
  onRoute={...}
>{child}</Router>
```

* `location: string` - Required. The current pathname. Should be `ctx.url` in a Fusion plugin, or `req.url` in the server or `location.pathname` in the client
* `basename: string` - Optional. Defaults to `''`. A route prefix.
* `context: {setCode: (string) => void}` - Optional.
  * `setCode: (string) => void` - Called when `<Status />` is mounted. Provides an HTTP status code.
* `onRoute: ({page: string, title: string}) => void` - Optional. Called when a route change happens. Provides a pathname and a title.
* `child: React.Element` - Required.

#### Route

Defines what gets rendered for a given route. Multiple routes can be rendered at the same time if they exist outside a `Switch` component.

```jsx
import {Router, Route} from 'fusion-plugin-react-router';

<Router>
  <Route exact component={component} path={...} trackingId={...}>{children}</Route>
</Router>
```

See the [react-router documentation for `<Route>`](https://reacttraining.com/react-router/web/api/Route)

* `trackingId: string` - Optional. To set an analytical name for the route, and make it the first candidate to determine `payload.title` when emitting [routing events](#routing-events-and-timing-metrics).

#### `Link`

Similar to `<a>`, creates a link that routes using `history.pushState` rather than a page change.

```jsx
import {Router, Link} from 'fusion-plugin-react-router';

<Router>
  <Link to="{...}">{children}</Link>
</Router>;
```

See the [react-router documentation for `<Link>`](https://reacttraining.com/react-router/web/api/Link).

#### `Switch`

Renders the first child `Route` that matches the path.

```jsx
import {Router, Switch} from 'fusion-plugin-react-router';

<Router>
  <Switch>{children}</Switch>
</Router>;
```

* `children: React.Children<Route>` - React children must be `Route` components.

See the [react-router documentation for `<Switch>`](https://reacttraining.com/react-router/web/api/Switch).

#### `Status`

Signals to the `Router` context that an HTTP status change is required.

```jsx
import {Router, Route, Status} from 'fusion-plugin-react-router';

<Router>
  <Route component={() => <Status code={...}>{child}</Status>} />
</Router>
```

* `code: number` - A HTTP Status code to be used if this component is mounted. The status code is sent to a `context.setCode` call in `Router`
* `child: React.Element` - A React element

#### `NotFound`

Equivalent to `<Status code={404}></Status>`

```jsx
import {Router, Route, NotFound} from 'fusion-plugin-react-router';

<Router>
  <Route component={() => <NotFound>{child}</NotFound>} />
</Router>;
```

* `child: React.Element` - A React element

#### `Redirect`

Signals to the `Router` context to navigate to a new location.

```jsx
import {Router, Route, Redirect} from 'fusion-plugin-react-router';

<Router>
  <Route component={() => <Redirect to="/">{child}</Redirect>} />
</Router>;
```

* `to: string|object` - Required. A URL or location to redirect to.
* `push: boolean` - Optional. When true, redirecting will push a new entry onto the history instead of replacing the current one.
* `code: number` - Optional. A HTTP Status code to be used if this component is mounted.

#### `BrowserRouter`

A `<Router>` that uses the HTML5 history API to keep your UI in sync with the URL.. This is a re-export of React Router's `BrowserRouter` (from `react-router-dom`)

```js
import {BrowserRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<BrowserRouter>`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/api/BrowserRouter.md).

#### `HashRouter`

A `<Router>` that uses `window.location.hash` to keep your UI in sync with the URL. This is a re-export of React Router's `HashRouter` (from `react-router-dom`)

```js
import {HashRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<HashRouter>`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/api/HashRouter.md).

#### `MemoryRouter`

A `<Router>` that keeps the history of your "URL" in memory (does not read or write to the address bar). This is a re-export of React Router's `MemoryRouter`

```js
import {MemoryRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<MemoryRouter>`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/api/MemoryRouter.md).

#### `withRouter`

Exposes `match`, `location` and `history` properties of the React Router history object as props. This is a re-export of React Router's `withRouter`.

```js
import {withRouter} from 'fusion-plugin-react-router';
```

See the [react-router documentation for `withRouter()`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/withRouter.md).

#### `matchPath`

Programmatic API to run React Router's route matching algorithm. This is a re-export of React Router's `matchPath`.

```js
import {matchPath} from 'fusion-plugin-react-router';
```

See the [react-router documentation for `matchPath()`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/matchPath.md).
