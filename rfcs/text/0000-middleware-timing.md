* Start Date: 2021-02-22
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

Fusion.js currently measures and emits timing information for how long a request takes when navigating downstream and upstream middleware. However, since every request to the web server runs through the complete middleware stack, it can be difficult to debug why some requests can take longer than normal which directly affects measured p95/p99 times. The purpose of this RFC is to add the ability for Fusion.js to emit detailed timing metrics for each middleware so that app owners can leverage that data to help improve performance.

# Motivation

The surface area of the core Fusion.js framework is small. By design developers are expected to provide functionality through Fusion.js plugins that are registered with the app. These plugins can be used to add middleware to the Fusion.js request lifecycle. The middleware are topologically sorted by their dependencies and then loaded into the internal Koa instance.

A typical Fusion.js app can easily reach two to three dozen registered middleware. Every request that comes through to Fusion.js will run through all registered middleware twice - once on the the downstream (before vdom rendering) and once on the upstream (after vdom). Thus, every request is beholden to what logic these middleware run and any slowdown in a single middleware can slow down the entire request.

There is no easy way to analyze which middleware are problematic and slow other than eyeballing middleware, trying to figure out which ones are in the critical path of requests they should not be (e.g. calling a middleware that only cares about SSR requests for all requests). Debugging why an endpoint could take 2 to 3 seconds for a p99 case can be challenging using the current available tools.

Providing a way to measure middleware timing also can help inform the user to the ramifications of registering lots of middleware with their service. It is not immediately obvious that each additional middleware registerd to Fusion.js can potentially affect every request that comes in due to how Koa middleware are designed to work. Thus, providing a tool to measure middleware times can educate the user to a problem they might not have realized could happen.

# Detailed design

### Measuring

To measure how long a middleware takes to run, we can wrap every registered middleware with a wrapper that calculates the time it takes to run the wrapped middleware on the downstream and upstream.

The following experimental code is an example of how this could be done:

```js
// fusion-core/src/base-app.js
// FusionApp.resolve()
function wrapMiddleware(originalMiddleware) {
  return async (ctx, next) => {
    const downstreamStart = now();
    let upstreamStart = 0;
    const timing = {token: token.name, source: /* Extract source from stack */, downstream: -1, upstream: -1};
    ctx.timing.middleware.push(timing);

    // Wrap the next method that is passed to the original middleware so we can measure how long the downstream takes
    const wrapNext = async () => {
      timing.downstream = now() - downstreamStart;
      await next();
      // Start of upstream
      upstreamStart = now();
    };
    await originalMiddleware(ctx, wrapNext);
    // After awaiting the original middleware, upstream is done
    timing.upstream = now() - upstreamStart;
  };
}
```

The wrapped middleware will start a timer, run the original middleware, then call the modified `next` method which will measure the time it took to run the downstream portion of the middleware. Then, when Koa processes the middleware on the upstream, an upstream timer will be started before the original middleware upstream code is run which lets us measure how long the upstream time takes.

Since anonymous middleware can be registered without an associated token, we can parse the error stack that is generated to fetch the source file the middleware was from to help in identification. Otherwise, the token name can be used.

`ctx.timing.middleware` is an array that are defined to store the records of tokens (or source file) and time durations. These values will be defined in the current existing timing plugin that is part of `fusion-core`.

### Emitting

Accessing the middleware data can be done by chaining onto the existing `ctx.timing.end` promise and reading the values from `ctx.timing.middleware`.

```js
// Initialization in fusion-core/src/plugins/timing.js
ctx.timing.middleware = [];

// Add timing information to intermediate downstreamTimings and upstreamTimings variables in wrapper
ctx.timing.middleware.push({ /* Data blob */});

// When entire middleware chain is processed
ctx.timing.end.then(() =>
  // Read ctx.timing.middleware
);
```

The format of the data collected in middleware timings will be:

- **tokenName** - Name of the token the middleware was registered to (or `UnnamedPlugin` if anonymous)
- **downstream** - Duration in milliseconds for the middleware on the downstream pass
- **upstream** - Duration in milliseconds for the middleware on the upstream pass
- **source** - Source file and line number where the middleware was registered

Since `ctx.timing.end` is accessible to every plugin in the chain, any consumer can just chain onto `ctx.timing.end` and then read the values to emit elsewhere.

### Enabling of middleware timing

We will be creating a `EnableMiddlewareTimingToken` to be exported from `fusion-core`.

Middleware wrapping will be controlled by the value of `EnableMiddlewareTimingToken` being `true`. If `true`, then during app resolution, we will internally check whether or not that token has been registered and if so, enable the middleware wrapping code.

```js
import {EnableMiddlewareTimingToken} from 'fusion-core';

if (__NODE__) {
  app.register(EnableMiddlewareTimingToken, true);
}
```

### Client measuring

Setting the token to true on the client will wrap all middleware on the client as well. We won't provide a way to send the `ctx` data (e.g. an endpoint that we mount to process the data) but any app owner would be able to do so on their own.

# Drawbacks

We are slightly increasing the surface area of logic within `fusion-core` by adding the middleware wrapping but it is a logical extension of the measuring we already do for render times, downstream, and upstream times that happens in the timing plugin.

# Alternatives

Timing information could be collected on the user side by manually measuring the time it takes to run any user registered middleware. This will not capture system middleware though since the user will not have access to modify those middleware. Adding manual timing information is a cumbersome process and likely to result in missed data if someone adds a middleware later and forgets to call the timing API.

Also, for reference, these alternative methods were first considered and passed on:

1) Enable the feature behind a `ENABLE_MIDDLEWARE_TIMING` environment variable

```js
if (__NODE__ && process.env.ENABLE_MIDDLEWARE_TIMING) {
  resolvedPlugins.push(wrapMiddleware(plugin.middleware(resolvedDeps, provides)));
}
```

Env variables don't work on the client side and there is also no easy way to define a whitelist unless we stick it inside `.fusionrc` or as a `package.json` field. Using tokens to define configuration is a more Fusion-way to do this which is why this idea was passed on.

2) Add functionality to `enhance` and add an `enhanceAll` method

This solution is two parts: first, extend `enhance` so that it passes in the plugin middleware to the enhancer. Then, when the enhancer is being run, allow for a new middleware to be returned to replace the original middleware.

Next, add an `enhanceAll` method that will take as an argument an enhancer and run that enhancer on every plugin registered with the Fusion.js app. Generally this API will be seldom used but in this case, it will allow for wrapping all middleware that are defined in the system.

This solution is a bit more code and increases the surface area of the core API but it abstracts out the idea of wrapping middleware into a reusable approach.

However, `enhanceAll` would basically just be for this feature as there aren't many other practical usage cases for it.

# How we teach this

The feature will be opt in so generous documentation of the how to enable it as well as how to utilize the timings will be provided.
