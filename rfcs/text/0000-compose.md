* 2019-03-18
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

This adds support for composing plugins via the `composePlugins` API.

# Basic example

```js
import {composePlugins} from 'fusion-core';
function composeSum(items) {
  return items.reduce((sum, item) => {
    return sum + item;
  }, 0);
}
app.register(ComposeExampleToken, composePlugins([
  createPlugin({
    provides: () => 2
  }),
  createPlugin({
    provides: () => 3
  }),
]), composeSum);

// ComposeExampleToken => 5
```

# Motivation

There are often situations where you need to manage composing a large amount of objects onto a single token. This can be done today with a few approaches today,
but they all require significant boilerplate and often unreasonable overheard. For example, you may want to split your graphql schemas and resolvers up into many
separate modular schemas, and combine them onto a single token using schema stiching. However as the number of separate schemas expands upwards of 10, 20, it 
becomes restrictive to manage separate tokens for each separate schema.

## Use Cases

A real life use case of `composePlugins` would be managing graphql schemas.

```js
const TokenA = createToken('TokenA');
const TokenB = createToken('TokenB');
const TokenC = createToken('TokenC');
const TokenD = createToken('TokenD');
const TokenE = createToken('TokenE');
// Old way
app.register(TokenA, SchemaA);
app.register(TokenB, SchemaB);
app.register(TokenC, SchemaC);
app.register(TokenD, SchemaD);
app.register(TokenE, SchemaE);

app.register(SchemaToken, createPlugin({
  deps: {
    a: TokenA,
    b: TokenB,
    c: TokenC,
    d: TokenD,
    e: TokenE,
  },
  provides({a, b, c, d, e}) {
    return mergeSchemas([a,b,c,d,e])
  }
}))
```

This becomes exceedingly difficult as the number of schemas increases. With the app.compose method, this could be replaced with:

```js
// new way
app.register(SchemaToken, composePlugins([SchemaA, SchemaB, SchemaC, SchemaD, SchemaE], composeFn));
```

Another real life use case could be managing redux store enhancers.

```js
app.register(ReduxEnhancerToken, composePlugins([enhancerA, enhancerB, enhancerC], composeFn)
```

# Detailed design

This RFC proposes a new export from `fusion-core`: `composePlugins`. The `composePlugins` function will take a list of plugins and a compose function which
will be used to compose their resolved values. The compose function can also return a plugin which will resolve to the composed value.

The type definition will look something like this:
```js
type composePlugins<T> = (plugins: Array<FusionPlugin<any, T>, composeFn: (values: Array<T>) => T || FusionPlugin<any, T>): FusionPlugin<any, T>;
```

# Drawbacks

This approach still requires a centralized place where plugins are composed. This can be somewhat restrictive when working with a large number of plugins that need
to be composed (upwards of 50 to 100). Having a API which allows distributed composition provides more flexibility when managing code organization. For example, it
would support organizing by feature rather than by type. However, this rigidity could also provide benefits to readability and debuggability. 

# Alternatives

One alternative is to add an `app.compose` method which would allow plugins to be composed with the compose function associated with a token. This would
have the benefit of more easily allowing more distributed registrations across files without a central place for composition. However it has a few downsides

- app.compose would not be tree shakable
- the compose function would not have access to the DI tree, and therefore could not declare dependencies

There are various minor alternatives with respect to naming and argument order. A few examples:

```js
import {createComposedPlugin} from 'fusion-core'
createComposedPlugin(plugins, compose);
```

```js
import {composePlugins} from 'fusion-core'
composePlugins({plugins, compose});
```

```js
import {composePlugins} from 'fusion-core'
composePlugins(compose, plugins);
```

```js
import {composePlugins} from 'fusion-core'
composePlugins(compose)(plugins);
```