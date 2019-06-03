* 2019-05-31
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

This adds support for asynchronously instantiated plugin services (i.e. `.provides`).

# Basic example

```js
import App, {createToken} from 'fusion-core';

export default async function start(options: any = {}) {
  const root = options.root || DefaultRoot;
  const app = new App(root, options.render);

  const SomeToken = createToken('someToken');
  app.register(
    SomeToken,
    createPlugin({
      provides: deps => Promise.resolve(42),
    })
  );
  app.register(
    createPlugin({
      deps: {someDep: SomeToken},
      provides: ({someDep}) => {
        /* Prior to the implementation of this RFC, the following line will
         * fail as `someDep` is of type `Promise<number>` instead of
         * `number`.
         */
        (someDep: number);
        return someDep + 5; // 47 instead of "[object Promise]5"
      },
    })
  );

  return app;
};
```

# Motivation

This proposal is motivated by situations where a plugin's service requires some initialization that occurs asynchronously (e.g. I/O, requests to back-end services, etc).  Today, there exists workarounds but they require additional boilerplate or are fairly clunky to use, leading to a degraded developer experience.

A few potential workarounds:
- a service may be wrapped in a `Promise<TService>` that the consumer must resolve prior to usage.
- a service may expose an asynchronous initialization method that must be resolved prior to usage.  For example, in the `middleware` as part of processing a request.
- use blocking calls only and avoid the advantages of asynchronous execution.

## Use Cases

There are a number of real life use cases where the app reaches beyond the boundaries of its code.  A few of these use cases are illustrated below.

#### Example #1

A plugin that must communicate with a back-end service in order to initialize its service:

```js
// old way
app.register(createPlugin({
  provides: () => {
    let isInitialized = false;
    return {
      doSomething: () => {
        if(!isInitialized) throw new Error("Not initialized!");
        /* some business logic */
      },
      initializeAsync: async () => {
        /* some async call to back-end service */
        isInitialized = true;
      }
    };
  }
}));
```

In the above case, a consuming plugin that directly depends upon the above plugin's service cannot utilize the exported service inside of their service until it has been initialized.  The consuming plugin in this case requires an asynchronous initialization step that initializes the parent service.

```js
// new way
app.register(createPlugin({
  provides: async () => {
    /* some async call to back-end service */
    /* e.g. await someInitializationCall(); */
    return {
      doSomething: () => {
        /* some business logic */
      }
    };
  }
}));
```

A consuming plugin that depends upon the above plugin will be able to consume the exported service and use it synchronously.

#### Example #2

A plugin that handles I/O as part of its initialization:

```js
// old way
const ASSET_TO_LOAD_PATH = '<some_path>';
app.register(
  createPlugin({
    provides: () => {
      const loadedAsset = __DEV__
        ? 'some value'
        : fs.readFileSync(ASSET_TO_LOAD_PATH, 'utf8');
      return loadedAsset;
    },
  })
);

// new way
app.register
  createPlugin({
    provides: async () => {
      const loadedAsset = __DEV__
        ? 'some value'
        : await promisify(fs.readFile(ASSET_TO_LOAD_PATH, 'utf8')); // No longer blocking!
      return loadedAsset;
    },
  })
);
```

# Detailed design

This RFC proposes altering the signature for the [`provides` method on `FusionPlugin`](https://github.com/fusionjs/fusionjs/blob/master/fusion-core/src/types.js#L59) to allow returning a promise that resolves to the underlying service:

```js
type FusionPlugin<Deps, Service> = {|
   ...
   provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Promise<Service> | Service,
};
```

When a plugin depends upon another plugin whose `.provides` method returns a promise, that promise is first resolved prior to being injected as a dependency.

# Proof of concept / PoC

A proof of concept (PoC) detailing the necessary changes to `fusion-core` and `fusion-cli` can be found here:

TBD

Additionally, a PoC for the changes necessary for `fusion-test-utils` can be found here:

TBD

# Drawbacks

This approach involves a breaking change.  Plugin resolution now occurs asynchronously, which requires changes to `fusion-core` (breaking) and `fusion-cli` (non-breaking).

Downstream effects include breaking changes to many consumers' test suites as well as testing helpers, like `fusion-test-utils`.  These often resolve the `FusionApp` themselves which must now be done asynchronously.  Many of these changes can be codemodded to avoid distruption to existing consumers, provided they follow best practices around testing for Fusion.js.

# Alternatives

Alternatives include the current workarounds discussed earlier in this RFC.
