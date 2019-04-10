* Start Date: 2019-03-21
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

Add hook for consuming a registered service


# Basic example

We have a plugin registered to a token. We want to use the service that plugin provides.

```javascript
// components/Example.js
import {ExampleToken} from 'fusion-tokens';
import {useService} from 'fusion-react';

export default function Example() {
  const service = useService<typeof ExampleToken>(ExampleToken);

  return (
    <button onClick={service}>Invoke service</button>
  );
}
```

# Motivation

Consuming services through the legacy Context API is cumbersome and increasingly difficult with the adoption of hooks in Fusion. This proposal aims to provide a simplified and contemporary way of providing services to a React application.

This work will not include refactoring existing plugins to hooks but will allow the migration path for all current '-react' plugins in the near future.

# Detailed design

### useService

The `useService` hook would get a function from Context to lookup the registered service for the supplied token.

```javascript
// fusion-react
const ServiceContext = React.createContext<any>(() => {});

export function useService<TService>(token: Token<TService>): TService {
  const getService: (Token<TService>) => TService = React.useContext(
    ServiceContext
  );
  const provides = getService(token);
  return provides;
}
```
### Context.Consumer

In order to provide a hook-less approach for applications that either don't use hooks or will not migrate from the HOC pattern that uses legacy Context API, we will expose the ServiceContext for direct usage. In addition, we can also expose a simply React component that uses render props to provide a similar functionality to the `useService` hook.

```javascript
// fusion-react
type Props<TService> = {
  token: Token<TService>,
  children: TService => Element<any>,
};

export function ServiceConsumer<TService>({
  token,
  children,
}: Props<TService>) {
  return (
    <ServiceContext.Consumer>
      {(getService: (Token<TService>) => TService) => {
        const provides = getService(token);
        return children(provides);
      }}
    </ServiceContext.Consumer>
  );
}

export {ServiceContext};

// components/Example.js
export default function Example() {
  return (
    <ServiceConsumer token={ExampleToken}>
      {service => (
        <button onClick={service}>Invoke service</button>
      )}
    </ServiceConsumer>
  );
}
```

### Fusion Context

Many plugins depend on the Fusion middleware context. Therefore in addition to getting a service from a hook, we need to allow access to context in a similar fashion. This is done simply enough with Context.

```javascript
// fusion-react
export const FusionContext = React.createContext<any>({});

// components/Example.js
import {useContext} from 'react';
import {FusionContext} from 'fusion-react';

export default function Example() {
  // ...
  const ctx = useContext(FusionContext)
  // ...
}
```

### Context.Provider

The ServiceContext Provider would supply a function that can get the registered service.

The most obvious approach is to simply provide access to the `getService` method on the app instance. This could be done with a very simple plugin.

```javascript
// fusion-react
export default class App extends FusionApp {
  constructor() {
    // ...
    this.register(serviceContextPlugin(this));
  }
}

function serviceContextPlugin(
  app: FusionApp
): FusionPlugin<void, void> {
  return createPlugin({
    middleware(): Middleware {
      return (ctx, next) => {
        ctx.element = ctx.element && (
          <FusionContext.Provider value={ctx}>
            <ServiceContext.Provider value={app.getService}>
              {ctx.element}
            </ServiceContext.Provider>
          </FusionContext.Provider>
        );
        return next();
      };
    }
  });
}
```

`getService` provides access to the resolved service, which is exactly what we want. Though I can find examples of its usage, `getService` is an undocumented method so it's possibly intended to be private.

FusionContext gives access to the Fusion middleware context object.

### Error handling

Using `useService` or `ServiceConsumer` will throw an exception in cases where a token hasn't been registered, the plugin has no `provides`, or the plugin `provides` returns `undefined`. Hooks need to be used unconditionally, so these exceptions will break the render and can only be caught with an ErrorBoundary around the component. Using an optional token will suppress the exception that would be thrown in these cases. This provides users a way to use a service through a hook conditionally, which is otherwise unallowed in hooks semantics.

```js
const service = useService(ExampleToken); // throws if not registered

const optionalService = useService(ExampleToken.optional);
if (optionalService) {
  // token was registered
} else {
  // was not registered, no error thrown
}
```

# Drawbacks

The simple approach above is possible to implement in a Fusion application using a plugin, such as in `app.js`. There is no technical constraint for this particular solution to be in the fusion-react package. That being said, there are other reasons for the solution to not exist at the consumer level.

This change will introduce a divide between a new way and the old way of using HOCs for services. The tech debt already exists, but this work needs to be closely followed with migration/codemods to upgrade existing '-react' packages.

# Alternatives

There is no alternative to migrating legacy Context to the latest Context implementation. The current limitations are unavoidable.

The alternative to supporting the `useService` hook would be to use the `ServiceContext` context directly. Users would need some boilerplate code to then pass their token into the returned context function. The overhead is not huge, but it would be ubiquitous and the hook is extremely straightforward work.

# Adoption strategy

Fusion devs can opt-in to the new approach, granted they are using React v16.8. Hooks can co-exist with legacy Context API. Likely we will be unable to completely codemod the migration.

# How we teach this

`useService(token)`

> *use* the *service* associated with this *token*

The current concepts in Fusion are actually more straightforward with hooks. React developers are getting comfortable with hooks and the concepts are well-documented.