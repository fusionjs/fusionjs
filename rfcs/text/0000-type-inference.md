# FusionJS Plugin Type Inference

# Summary

Flow v0.85 changed the way generic type inference works in a way which meant we were forced to explicitly provide type annotations for `createPlugin`. 
After further analysis, I believe we can update the our type definitions slightly in a non-breaking way which will add suppot for type inference when
defining plugins.

# Motivation

One of the biggest strengths of `Fusion.js` is type safe dependency injection. Prior to flow v0.85, this was possible without any explicit type annotations.

For example, prior to v0.85:

```js
export default createPlugin({
  deps: {
    logger: LoggerToken,
  },
  provides({logger}) {
    return 5;
  }
});
```

After flow v0.85

```js
type DepsType = {
  logger: typeof LoggerToken,
}
type ProvidesType = number;
export default createPlugin<DepsType, ProvidesType>({
  deps: {
    logger: LoggerToken,
  },
  provides({logger}) {
    return 5;
  }
});
```

The additional requirement of declaring the dependency types and API type explicitly causes some unnecessary friction when defining plugins which could be improved
with the ability to infer these types.

# Detailed Design

While type inference of the `createPlugin` API does not work, some generic type inference across file boundaries does. For example:

```js
export function identity<T>(a: T): T {
  return a;
}

// str is correctly inferred as a string
export const str = identity('str');
```

So why does this example of generic type inference work but our `createPlugin` API does not? In summary, "input positions reachable from exports must be annotated."
This is described in detail in this [article](https://medium.com/flow-type/asking-for-required-annotations-64d4f9c1edf8).

So in order to fix type inference in our `createPlugin` API, we need to find which of the generics are used in input positions that are reachable by exports.
Looking at a simplified version of our `createPlugin` API:

```js

type FusionPlugin<Deps, Service> = {|
  deps?: Deps,
  provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  middleware?: (
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: Service
  ) => Middleware,
  cleanup?: (service: Service) => Promise<void>,
|};

function createPlugin<Deps, Service>(p: FusionPlugin<Deps, Service>): FusionPlugin<Deps, Service> {
  // ...
}
```

In this example, the `Service` argument is in the input position in the `cleanup` function as well as the `middleware` function. Despite `deps` being used
in the `provides` and `middleware` function, it is not directly reachable from exports because of the usage of `$ObjMap`. 

Looking at the `cleanup` method is the simplext example. The reason the `Service` generic here qualifies as a type in the input position is demonstrated by
the following example:

```js
export const plugin = createPlugin({
  provides: () => {
    return 5;
  }
  cleanup(service) => {
    console.log(service);
  }
});

// other file
import {plugin} from 'file';
plugin.cleanup('test');
```

In this case, the `service` argument to `cleanup` is inferred as `number | string` while with fusion semantics it should be `number` and result in an error
when called with a string. This does not match the flow semantics however due to the process of subtyping ([read more](https://flow.org/en/docs/lang/subtypes/)).

Taking a step back, if we look at our `createPlugin` API we can take advantage of the fact that the return value from `createPlugin` is designed to be opaque.
In other words, it is not designed to have its properties accessed directly by consumers like in the cleanup example. 

There are two parts of the type checking of fusion plugins. The first part is in the `createPlugin` call itself. This makes sure all the parts of the plugin are 
consistent. For example, the declared deps match the types of the deps passed into `provides` and `middleware`, and the type returned from `provides` matches the 
type injected into `cleanup` and `middleware`. All of this can be done without having any return type from `createPlugin`.

The second part is type checking the `app.register` and `app.enhance` calls. This is done to verify the type of the token matches the provides type of the plugin, 
and this is the part which depends on the return type of `createPlugin`. The key thing to notice here is that we only need the type of the `provides` method of 
the plugin to verify it matches the token. At this point, deps, cleanup, and middleware are all irrelevant. 

Because `createPlugin` should return an opaque type and because we only need the `provides` type to verify with `app.register`, we can update the `createPlugin` 
return type to remove all generics in input positions without losing any type safety for consumers. There are several ways we could do this, but the simplest
would be replacing the `service` generic with `any` in the return type of `createPlugin` whenever it is referenced in an input position. We also need to specify
the properties as covariant.

```js
type CreatePluginArgs<+Deps, Service> = {|
  +deps?: Deps,
  +provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  +middleware?: (
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: Service
  ) => Middleware,
  +cleanup?: (service: Service) => Promise<void>,
|};

type FusionPlugin<+Deps, +Service> = {|
  +deps?: Deps,
  +provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  +middleware?: (
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: any 
  ) => Middleware,
  +cleanup?: (service: any) => Promise<void>,
|};

function createPlugin<Deps, Service>(p: CreatePluginArgs<Deps, Service>): FusionPlugin<Deps, Service> {
  // ...
}
```

[Try Flow Link](https://flow.org/try/#0C4TwDgpgBAogHsATgQwMbAEoWAV0QOwBVxoBeKAHgDUA+ACjoEopSaornX2BuKPqAFChIUALIBLACaSANhADuyRGSjJ8IbkJJQAwsuTAIABRk4A5uPwBBRGYDOFANQARCGDsAaKAGUIiAG7iqBBs5ADeAD6CfI6SbnYA-ABcUK7uHgIxYIgA9oFxiSl0aXYpACQA8gBGAFaiyGAUJVAAZFBhAL5e8EhomNh4RCQ0nGy+AUEQGTEAtlKyCkoQyVB0mfwl5dV1DU3xre1dsAgo6Fi4BMSQNNP844HBKfeT66Ni83KKyreOqHJqODAKzodj8DwgTzBkzeRlyc1BFH8OSkNwEEQ6mn4gmE0AAYjg7OIcvgTOZLE4Sl5HM9gqF2hF1rF4itKYzsnkpBBCqtNlBKrV6o1mm1Ot0Tn1zoMriE3jSpoy5tJPktges+Lz+TshfsRUceqd+hchtdbnw5Sk1CBolA3hIlYtvoy-hAAUCiqCJo9VOoYXDxAikSiMujMfwBAAzHD4dBE-BQVD6Qykiz4PbpHxQ2l0JT2FJ6F1J0wpmz2NOeDOemUpfGE4nJ8mUivgthhNX8ZRG1S2OyaDptgSoYl2YBQQg5ADWEGsLFWbwA5HPNIP8MPRxOpwAhGdMFhsACsob4AggcDAOUQI+Xq-rcfICYLxiLljoraxfDi7hSr7ffGQKTHk7WKab5VP+674BuwF8F0bZ8Oy+Rci+yBeFUHTMK2ACQGEdoMUAHrBUAwT+ioLF8EBIShaHtARfA4QQqzoHAXj4CewBvN+P60QM9EsQgTCHm+fY-kRb7Oq6IIQDI4boTRUB0XGsI5PCEAAHTKHYOQyP45GMAJ0ECGh3BAA)

This will allow us to get type inference with fusion plugins across module boundaries while still getting all the performance benefits of the types first
flow architecture and keeping all the same type safety for fusion consumers.

# Drawbacks

While there is type information lost, I would argue it is not type information that should be used in any meaningful way as it is not recommended
to directly access properties of fusion plugins. 

The only other drawback we could potentially see is if future changes to flow or the fusion plugin API cause us to lose the ability to get type inference
we will need to migrate all usages of `createPlugin` to include explicit type annotations, as we have done in the past.

---

# Alternatives

There are various alternatives to how we can hack the type system to remove references to generics in input positions. One possibility is we could completely remove
the presence of the `cleanup` and `middleware` properties from the return type of `createPlugin`. I think this is worse than using `any` since those properties 
would still exist on the object.

Another alternative is we can use an identity function type along with `$Call` to mimic the behavior of `$ObjMap`. While this technically works, the flow team
has said this is a bug and is not guaranteed to continue working in future releases. (However the $ObjMap is behaving correctly).
