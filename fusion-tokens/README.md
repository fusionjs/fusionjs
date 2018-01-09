# fusion-tokens

Dependency injection tokens for FusionJS.

FusionJS dependency injection is based on tokens rather than strings. This avoids naming collision issues.
This package provides utilities to create named tokens, as well as common tokens that are used by packages maintained by the FusionJS team.

### Installation

```sh
yarn add fusion-tokens
```

### API

#### createToken

```js
import {createToken} from 'fusion-tokens';

const token = createToken(name);
```

Creates a DI token

* `name: string` - A human-readable name for the token. Used in error messsages.
* `token: Token` - A token

#### createOptionalToken

```js
import {createOptionalToken} from 'fusion-tokens';

const token = createOptionalToken(name, defaultValue);
```

Creates a special DI token with a default value associated with it

* `name: string` - A human-readable name for the token. Used in error messsages.
* `defaultValue: any` - The token's default value
* `token: Token` - A token

#### Tokens

`import {FetchToken} from 'fusion-tokens';`
`import {LoggerToken} from 'fusion-tokens';`
`import {SessionToken} from 'fusion-tokens';`
