* Start Date: 2019-12-04
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

This PR introduces the `RouteTagsToken` which will provide a set of tags associated with a Route. By default, the `name`
tag will be associated with a stable name for a route. The field can be set manually, but will generally be set by 
routing integrations such as fusion-plugin-react-router.

# Basic example

```js
import {RouteTagsToken} from 'fusion-core';
const middleware = async ({RouteTags: RouteTagsToken}, ({RouteTags}) => ctx, next) => {
  RouteTags.from(ctx).name = 'some-name';
  return next();
}
```

# Motivation

Many integrations require a stable name associated with a route. This is the case for things like metrics and tracing.
Any metrics system which requires low cardinality keys will have trouble with routes that include arguments such as 
uuids in the url. In the past we avoided providing a standard for handling this because we had no built in routing
solution in fusion. With the addition of functional plugins, we have the option to introduce routing behavior
into fusion-core. This provides us an opportunity to build a unified pattern for handling stable route names.

# Detailed design

The `RouteTags.name` property will be a string that can be set in any middleware. The standard use case for using 
`RouteTags.name` will be to go through existing integrations, rather than setting it manually. The value will default
to `'unknown_route'`. If no routes are matched, this will be used. Users could overwrite this behavior with custom logic,
which could for example set the default name to match `ctx.path`.

## Router Integration

Most router integrations will have support for extracting a stable route name from route definitions. For all SSR
routes, `ctx.name` should get set via the plugin providing router integration. For `react` this would likely be
`fusion-plugin-react-router`. Example:

```js
// request to /users/abcd123

// root component example
import {Route} from 'fusion-plugin-react-router';
import {RouteTagsToken} from 'fusion-core';

const root = (
  <div>
    <Route path="/user/:uuid" component={UserComponent} />
  </div>
);

const middleware = async ({RouteTags: RouteTagsToken}, ctx, next) => {
  await next();
  console.log(RouteTags.from(ctx).name); // '/user/:uuid'
}
```

## withRouteHandler

API Routes will have the `RouteTags.name` value set via the withRouteHandler API.

```js
import {withRouteHandler} from 'fusion-core';

function MyPlugin() {
  // RouteTags.name could automatically be set to `/user/:uuid` for matching routes
  withRouteHandler('/user/:uuid', (ctx, next) => {
    return next();
  });

  // could also support an explicit name parameter:
  // use "userByID" instead of implicit "/user/:uuid" as name
  withRouteHandler('/user/:uuid', 'userByID', (ctx, next) => {
    return next();
  });
}
```

## Multiple Matches

There are many scenarios which could trigger multiple routes being matched. For example:

```js
import {Route} from 'fusion-plugin-react-router';
const root = (
  <div>
    <Route path="/user" component={UserContainer} />
    <Route path="/user/:uuid" component={UserComponent} />
  </div>
);
```

The same pattern could happen with the `withRouteHandler` API.

```js
import {withRouteHandler} from 'fusion-core';

function MyPlugin() {
  withRouteHandler('/user', (ctx, next) => {
    return next();
  });
  withRouteHandler('/user/:uuid', (ctx, next) => {
    return next();
  });
}
```

In these situations, the `RouteTags.name` value will be set to match the route with the highest specificity.
In this example, the match would go to `'/user/:uuid'`.

This approach could likely be extended to work with client side route updates. For example:

```js
import {useContext, useService} from 'fusion-react';
function MyComponent() {
  const ctx = useContext();
  const tags = useService(RouteTags).from(ctx);
  console.log(tags.name);
}
```

# Alternatives

## RouteNameToken

One alternative could be a Token provided by fusion-core which could provide a Get/Set API for the route name.
For example:

```js
import {RouteNameToken, withDeps, withRouteHandler} from 'fusion-core';
function MyPlugin() {
  const [{RouteName}] = withDeps([RouteNameToken]);
  withRouteHandler('/user/:uuid', (ctx, next) => {
    const route = RouteName.from(ctx).get(); // /user/:uuid
    return next();
  });

  withRouteHandler((ctx, next) => {
    RouteName.from(ctx).set('value'); 
  });
}
```

This could also work with client side route updates.

```js
import React from 'react';
import {RouteNameToken} from 'fusion-core';
import {useService, useContext} from 'fusion-react';

function MyComponent() {
  const ctx = useContext();
  const RouteName = useService(RouteNameToken);
  const route = RouteName.from(ctx).get();
}
```

This option does not allow setting additional metadata along with the name.

## DynamicRoutesToken

An alternative approach to providing a generic API for getting and setting the stable route name is providing an opinionated way
of setting route name based on a list of dynamic routes. This approach would be very easily implemented and dropped in without
changing any existing behavior. It would not require any routing integration from fusion-plugin-react-router or a withRouteHandler API.

```js
import {DynamicRoutesToken} from 'fusion-core';

// register a map of urls to names
app.register(DynamicRoutesToken, {
  '/user/:uuid': 'user',
  '/test/:uuid': 'test',
});

// alternatively, we could register a set of routes with dynamic variables
// name could be automatically derived
app.register(DynamicRoutesToken, ['/user/:uuid', '/test/:uuid']);
```

The big downside of this approach is it doesn't compose well with other routing solutions. The user would end up duplicating
route declarations. For that reason, I don't think we should seriously consider this option.

# Adoption strategy

This could be added as a non-breaking change. We could start with support without the `withRouteHandler` API. Once
functional plugins lands, it can integrate with this API.
