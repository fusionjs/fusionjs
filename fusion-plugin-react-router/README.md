# fusion-plugin-react-router

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The `fusion-plugin-react-router` package provides a universal router plugin for React. The plugin automatically configures a router provider to account for route prefix, routing events, hydration in bundle splitting scenarios, etc.

The package also offers components to control HTTP status server-side.

This plugin uses the 6.x version of `react-router`.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
  * [Routing Events and Timing Metrics](#routing-events-and-timing-metrics)
  * [Accessing History](#accessing-history)
  * [`Router`](#router)
  * [`Routes`](#routes)
  * [`Route`](#route)
  * [`Link`](#link)
  * [`Status`](#status)
  * [`NotFound`](#notfound)
  * [`Navigate`](#navigate)
  * [`BrowserRouter`](#browserrouter)
  * [`HashRouter`](#hashrouter)
  * [`MemoryRouter`](#memoryrouter)
  * [`withRouter`](#withrouter)
  * [`matchPath`](#matchpath)
  * [Others](#others)
* [Plugin Changes From V5](#plugin-changes-from-v5)
* [Migration from V5](#migration-from-v5)

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
  Routes,
  Route,
  Link,
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
    <Routes>
      <Route caseSensitive={true} path="/" element={<Home />} />
      <Route caseSensitive={true} path="/test" element={<Test />} />
      <Route element={<PageNotFound />} />
    </Routes>
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

##### `UniversalEventsToken`

```jsx
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
```

The [universal events](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-universal-events) plugin. Optional.

Provide the UniversalEventsToken when you would like to emit routing events for data collection.

##### `GetStaticContextToken`

```js
import {GetStaticContextToken} from 'fusion-plugin-react-router';
```

Gives the ability to register custom static context for handling server side redirects and setting the status code. Optional.

For example:

```js
import type {Context} from 'fusion-core';
import {GetStaticContextToken} from 'fusion-plugin-react-router';

app.register(GetStaticContextToken, (ctx: Context) => {
  return {
    set status(code: string) {
      ctx.status = code;
    },
    set url(url: string) {
      ctx.status = 307;
      ctx.redirect(url);
    }
  }
});
```

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
  basename={...}
  history={...}
  context={...}
  onRoute={...}
>
  {child}
</Router>
```

* `basename: string` - Optional. Defaults to `''`. A route prefix.
* `child: React.Element` - Required.
* `context: {url: string, status: string}` - Optional.
* `history: History` - A history object that matches the interface from the `history` package.
* `onRoute: ({page: string, title: string}) => void` - Optional. Called when a route change happens. Provides a pathname and a title.

#### Routes

A container for `Route` components that provides matching abilities to match the current URL to render a specific tree of components.

```js
import {Routes} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<Routes>`](https://reactrouter.com/docs/en/v6/api#routes-and-route).

#### Route

Defines what gets rendered for a given route. Must be rendered with a `Routes` component.

```jsx
import {Router, Route} from 'fusion-plugin-react-router';

<Router>
  <Routes>
    <Route element={<Component />} path={...} trackingId={...}>{children}</Route>
  </Routes>
</Router>
```

See the [react-router documentation for `<Route>`](https://reactrouter.com/docs/en/v6/api#routes-and-route).

* `trackingId: string` - Optional. To set an analytical name for the route, and make it the first candidate to determine `payload.title` when emitting [routing events](#routing-events-and-timing-metrics).

#### `Link`

Similar to `<a>`, creates a link that routes using `history.pushState` rather than a page change.

```jsx
import {Router, Link} from 'fusion-plugin-react-router';

<Router>
  <Link to="{...}">{children}</Link>
</Router>;
```

See the [react-router documentation for `<Link>`](https://reactrouter.com/docs/en/v6/api#link).

#### `Status`

Signals to the `Router` context that an HTTP status change is required.

```jsx
import {Router, Routes, Route, Status} from 'fusion-plugin-react-router';

<Router>
  <Routes>
    <Route element={<Status code={...}>{child}</Status>} />
  </Routes>
</Router>
```

* `code: number` - A HTTP Status code to be used if this component is mounted. The status code is sent to a `context.setCode` call in `Router`
* `child: React.Element` - A React element

#### `NotFound`

Equivalent to `<Status code={404}></Status>`

```jsx
import {Router, Routes, Route, NotFound} from 'fusion-plugin-react-router';

<Router>
  <Routes>
    <Route element={<NotFound>{child}</NotFound>} />
  </Routes>
</Router>;
```

* `child: React.Element` - A React element

#### `Navigate`

Signals to the `Router` context to navigate to a new location.

```jsx
import {Router, Routes, Route, Navigate} from 'fusion-plugin-react-router';

<Router>
  <Routes>
    <Route element={<Navigate to="/">{child}</Navigate>} />
  </Routes>
</Router>;
```

* `to: string|object` - Required. A URL or location to redirect to.
* `replace: boolean` - Optional. When true, redirecting will replace the current entry on the history stack instead of pushing a new entry.
* `code: number` - Optional. A HTTP Status code to be used if this component is mounted.

#### `BrowserRouter`

A `<Router>` that uses the HTML5 history API to keep your UI in sync with the URL.. This is a re-export of React Router's `BrowserRouter` (from `react-router-dom`)

```js
import {BrowserRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<BrowserRouter>`](https://reactrouter.com/docs/en/v6/api#browserrouter).

#### `HashRouter`

A `<Router>` that uses `window.location.hash` to keep your UI in sync with the URL. This is a re-export of React Router's `HashRouter` (from `react-router-dom`)

```js
import {HashRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<HashRouter>`](https://reactrouter.com/docs/en/v6/api#hashrouter).

#### `MemoryRouter`

A `<Router>` that keeps the history of your "URL" in memory (does not read or write to the address bar). This is a re-export of React Router's `MemoryRouter`

```js
import {MemoryRouter} from 'fusion-plugin-react-router';
```

See the [react-router-dom documentation for `<MemoryRouter>`](https://reactrouter.com/docs/en/v6/api#memoryrouter).

#### `matchRoutes`

Programmatic API to run React Router's route matching algorithm. This is a re-export of React Router's `matchRoutes`.

```js
import {matchRoutes} from 'fusion-plugin-react-router';
```

See the [react-router documentation for `matchPath()`](https://reactrouter.com/docs/en/v6/api#matchroutes).

#### Others

For the complete list of re-exported components from React Router, visit the documentation here: https://reactrouter.com/docs/en/v6/api

---

### Plugin Changes From V5

For previous users of this plugin that was using React Router 5, the list below details the breaking changes between the old plugin and the V6 plugin:

* `RouterProviderToken` was removed which allowed for swapping the base Router component utilized on the server and browser. Now, the plugin internally uses the `Router` and `BrowserRouter` components from `react-router-dom` directly.
* The `Redirect` component was renamed to the `Navigate` component.
* The `Route` component was removed and a replacement `Routes` component was created.
* The usage of `history` V4 under the hood was updated to match the new API from `history` V5. Any programmatic usage of the history object that was provided by the old plugin will need to be updated to match V5.

---

### Migration from V5

The official documentation provides a detailed list of what changes need to be implemented: https://reactrouter.com/docs/en/v6/upgrading/v5

Because `<Route>` elements no longer take React component but React element instances, if you utilize the `split` API from `fusion-react`, you will need to wrap the output of `split` with a `React.createElement` call to ensure
that an element is being returned.
