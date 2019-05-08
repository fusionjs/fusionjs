[![Build status](https://badge.buildkite.com/51c7145b44d8842a8b71bb446614e49c8be0721f91633d11d8.svg?branch=master)](https://buildkite.com/uberopensource/fusion-tokens)

# fusion-tokens

Dependency injection tokens for Fusion.js.

Fusion.js dependency injection is based on tokens rather than strings. This avoids naming collision issues.
This package provides utilities to create named tokens, as well as common tokens that are used by packages maintained by the Fusion.js team.

---

### Table of contents

* [Installation](#installation)
* [API](#api)
  * [FetchToken](#fetchtoken)
  * [LoggerToken](#loggertoken)
  * [SessionToken](#sessiontoken)
  * [CacheToken](#cachetoken)

---

### Installation

```sh
yarn add fusion-tokens
```

---

### API

#### `FetchToken`

```js
import {FetchToken} from 'fusion-tokens';
```

A token for a fetch implementation.

##### Types

```flow
type Fetch = (input: string, options: Object) => Promise<Response>
```

Typically, [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) or a polyfill such as [unfetch](https://github.com/developit/unfetch).

#### `LoggerToken`

```js
import {LoggerToken} from 'fusion-tokens';
```

A token for a logger implementation.

##### Types

```flow
type Logger = {
  log(level: string, arg: any): void,
  error(arg: any): void,
  warn(arg: any): void,
  info(arg: any): void,
  verbose(arg: any): void,
  debug(arg: any): void,
  silly(arg: any): void,
}
```

Typically, `console` or a logger library such as [Winston](https://github.com/winstonjs/winston).

#### `SessionToken`

```js
import {SessionToken} from 'fusion-tokens';
```

A token for a session implementation.

##### Types

```flow
type Session = {
  from(ctx: Context): {
    get(key: string): any,
    set(key: string, val: any): void,
  },
}
```

Typically, the service provided by [`fusion-plugin-jwt`](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-jwt) or a custom wrapper around similar key-value store APIs (such as [Redis](https://redis.io/)).

#### `CacheToken`

```js
import {CacheToken} from 'fusion-tokens';
```

A token for a caching implementation.

##### Types

```flow
type Cache = {
  get(key: string): Promise<mixed>,
  set(key: string, val: any): Promise<mixed>,
  del(key: string): Promise<mixed>,
}
```

Standard API for caching.