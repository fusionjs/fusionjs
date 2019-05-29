* Start Date: 2019-05-28 
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

This PR documents a suggested path for supporting hooks in web-rpc, as well as options
for suspense compatible APIs.

# Basic example

NOTE: All of these examples assume a parent Suspense and ErrorBoundary, as well as a corresponding reducer for user actions.

## Pure RPC
```js
import {useRPC} from 'fusion-plugin-rpc';
import {useDispatch, useSelector} from 'react-redux'; 

function Component() {
  const rpc = useRPC();
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);
  if (!user) {
    throw new Promise((resolve, reject) => {
      dispatch({type: 'GET_USER_START'});
      rpc.getUser().then((result) => {
        dispatch({type: 'GET_USER_SUCCESS', payload: result});
        resolve();
      }).catch(e => {
        dispatch({type: 'GET_USER_FAILURE', payload: e});
        reject(e);
      });
    })
  }
  return <div>Hello {user.name}</div>
}
```

## RPC + Redux
```js
import {useRPCRedux} from 'fusion-plugin-rpc-redux-react';
import {useDispatch, useSelector} from 'react-redux'; 

function Component() {
  const rpc = useRPCRedux();
  const user = useSelector(state => state.user.user);
  if (!user) {
    throw rpc.getUser();
  }
  return <div>Hello {user.name}</div>
}
```

## RPC + Redux + React-Cache Patterns
```js
import {createRPCResource} from 'fusion-plugin-rpc-redux-react';

const useUser = createRPCResource('getUser', state => state.user.user);

function Component() {
  const user = useUser(args);
  return <div>Hello {user.name}</div>
}
```

# Motivation

Hooks and suspense provide opportunities for improved ergonomics of APIs for 
data fetching and state management. We can take advantage of these best by
updating our APIs to be compatible with hooks and suspense.

# Detailed design

This RFC proposes a few different APIs at different layers of abstractions. From lowest to highest level of abstraction:

1. `import {useRPC} from 'fusion-plugin-rpc';
2. `import {useRPCRedux} from 'fusion-plugin-rpc-redux-react';
3. `import {createRPCResource} from 'fusion-plugin-rpc-redux-react'; (experimental)
4. `import {createRPCReactorResource} from 'fusion-plugin-rpc-redux-react'; (experimental)


## `useRPC`

This API is not designed for direct consumer usage, but rather to be used as a 
building block into other APIs. 

```js
import {useRPC} from 'fusion-plugin-rpc';

function Component() {
  const rpc = useRPC();
  rpc.getUser(args); // returns a promise
}
```

This can be implemented either via a js Proxy or by serializing the supported methods on the server into the html.

## `useRPCRedux`

This can be built using the `useRPC` hook and the `useDispatch` hook. This provides an abstraction that should be easy to use and 
understand, but does require a small amount of boilerplate. It is designed to be used along side the useSelector API. 

```js
import {useRPCRedux} from 'fusion-plugin-rpc-redux-react';
import {useDispatch, useSelector} from 'react-redux'; 

function Component() {
  const rpc = useRPCRedux();
  const user = useSelector(state => state.user.user);
  if (!user) {
    throw rpc.getUser();
  }
  return <div>Hello {user.name}</div>
}
```

It also supports doing multiple calls in parallel.

```js
import {useRPCRedux} from 'fusion-plugin-rpc-redux-react';
import {useDispatch, useSelector} from 'react-redux'; 

function Component() {
  const rpc = useRPCRedux();
  const user = useSelector(state => state.user.user);
  if (!user) {
    throw Promise.all(rpc.getUser(), rpc.getTrips());
  }
  return <div>Hello {user.name}</div>
}
```

The drawback of this API is it requires users to separately check the cached state via useSelector. This is a few extra lines of code,
however I think it is pretty straight forward.

## `createRPCResource` (experimental)

This API is experimental and should likely not be implemented until further knowledge of suspense data fetching patterns is available. 
This pattern is inspired by the logic in the react-cache package, which shows some hints of how suspense based data fetching may look.

A major benefit of this approach is it provides a unified approach for managing cached state, error states, and loading states. A drawback 
to this approach is it takes more effort to get static typing.

```js
import {createRPCResource} from 'fusion-plugin-rpc-redux-react';

const useUser = createRPCResource('getUser', state => state.user.user);

function Component() {
  const user = useUser(args);
  return <div>Hello {user.name}</div>
}
```

## `createRPCReactorResource` (very experimental)

This API is very experimental, and should likely not be implemented in the short term. It is here mostly as a thought exercise. It tries
to provide a way to colocate all the state management and data fetching code for an RPC call into a single API. It uses the reactor pattern,
which was created as a way to code split reducers. See https://github.com/ganemone/redux-reactors

```js
import {createRPCReactorResource} from 'fusion-plugin-rpc-redux-react';

// This would be exported from a separate file
const useUser = createRPCResource({
  rpcId: 'getUser',
  selector: state => state.user.user,
  reactor: {
    start: (state, action) => {
      return {
        ...state,
        user: {
          ...state.user,
          loading: true,
        }
      }
    },
    success: (state, action) => {
      return {
        ...state,
        user: {
          loading: false,
          error: null,
          user: action.payload,
        }
      }
    },
    failure: (state, action) => {
      return {
        ...state,
        user: {
          ...state.user,
          loading: false,
          error: action.payload,
        }
      }
    },
  }
});

function Component() {
  const user = useUser(args);
  return <div>Hello {user.name}</div>
}
```

The major drawback to this pattern is it is less familiar to people, and can cause confusion as it is a non-standard pattern.

# Static Typing Concerns

While these APIs will not be able to provide the same level of type safety as provided by GraphQL, we can try and make them easy 
to add types to using generics. An important consideration is making it easy for the consumer to know what generics to pass. The
best way of doing that is making them consistent across calls. For example, allowing the user to pass in a single type for all calls
that matches the redux state, and the RPC handlers. Then we can use type helpers to get inference where needed. For example:

```js
// some-component.js
import type {HandlersType} from './rpc/handlers';
import useRPCRedux from 'fusion-plugin-rpc-redux-react';

function component() {
  const rpc = useRPCRedux<HandlersType>();
  throw rpc.getUser({userId: 'abcd'});
}

// ...
// rpc/handlers.js
// ...
type User = {
  id: string,
  name: string,
};
export type HandlersType = {
  getUser(args: {userId: string}, ctx: Context): Promise<User>
}

// ... fusion-plugin-rpc-redux-react
type ExtractArgumentType = <A>((A, any) => any) => (A) => any
function useRPCRedux<A: Object>(): $ObjMap<A, ExtractArgumentType> {
  // ... implementation ...
}
```

This pattern allows the consumer to maintain a single type which represents the RPC handlers API, and share that type across their server
and browser code.

This gets a bit more difficult as the abstraction grows. Having this pattern apply to `createRPCResource` and `createRPCReactorResource` for example
is much more difficult.

# Drawbacks

All the proposed API's are dependent on react suspense for data fetching. React suspense is still in an experimental phase and 
there is no support for server side rendering. We can get support via packages such as react-ssr-prepass, but there is a risk
that the behavior of this package will differ from the server side render behavior when react releases official support for suspense.

It is not yet recommended to use react suspense for data fetching. The only officially supported usecase is React.lazy. There are 
some examples of how to use the suspense pattern for data fetching in the react-cache package, but these patterns could change. There
is a risk that new recommended patterns will emerge that don't match with our recommendations here. This risk increases as our level
of abstraction increases. In other words, there is relatively low risk for `useRPC` and `useRPCRedux`, and high risk for `createRPCResource`
and `createRPCReactorResource`.

# Alternatives

We have a working model for data fetching with prepared and the current rpc APIs. We could continue using this, however at some point
we will want to switch to a hooks/suspense approach. We could do that now, or we could wait until official data fetching and ssr support
is released for suspense.

# Adoption strategy

Since these are new APIs, we should be able to do this in a non-breaking manner. This is not something that can be easily codemoded.

# How we teach this

Depending on how early we release this, we may need to have documentation on suspense patterns, since they are not well documented by react itself.
We will also need to update our guides to include examples using these patterns. 

# Unresolved questions

 - When will official support for data fetching and SSR with suspense be released?
 - Will the recommended patterns for data fetching with suspense change?