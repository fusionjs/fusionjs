# FusionJS dependency injection system

# Summary

A dependency injection system for FusionJS

# Motivation

It's currently difficult to mock dependencies when writing integration and end-to-end tests. The current manual wiring up of dependencies in main.js also leads to a lot of boilerplate.

A dependency injection (DI) system would make it easier to manage dependencies.

# Detailed design

The implementation is typed via Flow.js. The system involves three main areas of concern:

* token registry
* dependency declaration
* dependency registration

The following example illustrates how these areas of concern are wired up:

```js
// fusion-tokens (token registry)
import createToken from './create-token';

export const LoggerToken = createToken('logger');

// plugin.js (dependency declaration)
import {createPlugin} from 'fusion-core';
import {LoggerToken as logger} from 'fusion-tokens';

export default createPlugin({
  deps: {logger},
  provides: ({logger}) => new Service({logger}),
  middleware: ({logger}, service) => {
    return (ctx, next) => {
      return next();
    }
  },
});

// main.js (dependency registration)
import {LoggerToken} from 'fusion-tokens';
import Logger from 'some-logger';

export default () => {
  const app = new App();
  app.register(LoggerToken, Logger);
}
```

### Token registry

A token is a unique value with a unique [opaque type](https://en.wikipedia.org/wiki/Opaque_data_type). You can think of a token like you think about ES6 symbols: they are an unique identifier that can refer to one and only one service implementation at any given time. This RFC proposes implementing a token as function that throws the user-friendly error when a dependency resolution error occurs.

All tokens would be created via the `createToken` function and type-annotated with Flow in the registry or package where they reside.

We propose creating a package called `fusion-tokens` to serve as the registry for open source tokens, as curated by the FusionJS team. This package would include tokens such as `LoggerToken`, `ReduxToken`, and other tokens that are relavant to plugins that are maintained by the FusionJS team.

Plugins can be registries for their own tokens (for example, for configuration tokens). It's also possible to define private registries that re-export `fusion-tokens` in addition to exporting private tokens.

### Dependency declaration

Dependencies are declared via a `deps` property:

```js
createPlugin({
  deps: {
    a: AToken,
    b: BToken,
  },
  provides({a, b}) {
    return new Service({a, b});
  },
});
```

The `deps` object maps a variable name (such as `a` or `b` in the example above), to a service (represented by a token). When a service implementation is registered to a token, it becomes available as an injected dependency in the `provides` function.

### Dependency registration

Dependencies are registered to tokens:

```js
app.register(LoggerToken, Logger);
```

---

# Drawbacks

It may potentially be a lot of work to migrate early adopters if lots of them write plugins using the current API.

---

# Alternatives

### Passing mocks into main

The alternative to mock dependencies would involve passing mocks into the function in main.js:

```js
// main.js
import Logger from 'some-logger';

export default ({LoggerMock}) => {
  const app = new App();
  app.register(LoggerMock || Logger);
};
```

This is messy because it involves hard-coding test-related logic into the app, and polluting the API of the main export.

### String tokens

In AngularJS, the DI API required registering services to stringly-typed names. This comes with the limitation that two services can't have the same human-readable "name" and that there's no source of truth cataloguing what names are used within the DI container.

This RFC solves these issues by making names unique and not stringly-typed. In addition, using unique tokens makes it more natural to support userland dependency registration, and it makes it easier to support Flow type checking.

---

# Unresolved questions

* Reducing verbosity (related to flow.js, etc)
* Type safety when overriding plugins (i.e. disallowing coercion to union types)
