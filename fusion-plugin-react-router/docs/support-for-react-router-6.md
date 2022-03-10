# Support for React Router 6

This document serves as a brain dump for the architectural choices made when the plugin was upgraded
from React Router 5 to React Router 6.

### Deprecated Components

The old plugin used components that were no longer supported in RR6, like `<Switch>` and `<Redirect>`.
These were switched to the newer versions and documented.

### Removal of RouterProviderToken

The previous plugin allowed for replacing the stock <Router> with a custom one to faciliate third
party packages like `connected-react-router`. It was removed for two reasons:

* Since `connected-react-router` package does not support RR6, the main usage case is gone
* Swapping the browser instance is not as straight forward as before, mainly because the default
`BrowserRouter` creates a mechanism to subscribe between the history object changing locations and
updating the `Router`. Any custom provider passed in will need to scaffold that up manually and it is
an implementation detail that can easily be missed and cause the browser side to stop working.

### ServerRouter

The ability to pass a `StaticContext` object into the core `Router` component was removed. Because
this context was only used in the components that we define in the plugin (`Navigate`, `Status`), we
can preserve this behavior by leveraging the legacy `getChildContext()` API and adding what we need
there.

### ServerHistory

The API interface for this module was changed to match any changes that were made in `history` v5.
In regards to `basename`, there was a clear pattern between the relationship between the router
and the history object:

* On the router side, the router masks the URL prefix when conducting operations via the URL (like
route matching). Thus, when the URL is being fed into the router, the basename is stripped out. When
the URL is being sent out of the router, the basename is added onto the URL.
* On the history side, it works WITH the basename. So all operations to push/replace the URL will do
so with the basename.

The previous plugin and server history module didn't exactly follow this correctly so it caused the
prefix to be added to areas it didn't need to be so this was cleaned up in the upgraded plugin.

### BrowserRouter

Under the hood, the plugin uses the `unstable_HistoryRouter` component from `react-router-dom` since
we want to maintain the programmatic API from the plugin to allow for changing the page outside
of the React context. This allows us to create the history object external to the router itself
which is what the `BrowserRouter` implementation inside the plugin does.

### Routes / trackingId for Route

The previous plugin allowed for defining a `trackingId` property on the custom `Route` component that
the plugin exported. In order to replicate this functionality, a custom `Routes` component was created
that iterates through all child `Route` components, reads any custom `trackingId` values, and creates
an internal map of route path to `trackingId`. Then when we need to fire `onRoute`, we can do a
reverse lookup to see if we need to replace the page title with the `trackingId`.

The reason this indirection is needed is because internally RR6 does not actually render any `Route`
components. It looks directly at the children of the parent `Routes` component and rebuilds the
component tree with which it does its route matching. We cannot declare custom `Route` components
with a `trackingId` property here since the code also does an equality check to make sure all child components
of `Routes` match the real internal `Route` component which it wouldn't if we replaced it with a custom one.

Lastly, the code on the browser side uses a `useLocation()` hook call with an `useEffect()` so that
we can fire `onRoute` anytime the current location changes and we can detect that we have a router match using
`matchRoutes`. On the server side since `useEffect()` does not trigger we make a manual one time call.

### Navigate (Redirect in RR5)

Server side redirection was removed in RR6 so in order to preserve compatibility, the custom `Navigate`
component supports reading a status code and using the parent context object to set `ctx.status`
as well as call into the `ServerHistory` module to actually make the redirect.
