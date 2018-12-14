# fusion-plugin-introspect

Visualize the tree of plugins in your app

---

## Table of contents

- [Try it out](#try-it-out)
- [Full usage example](#full-usage-example)
- [Data schema](#data-schema)
- [API](#api)
  - [Registration API](#registration-api)
  - [Storage](#storage)
- [CLI](#cli)
  - [fusion-run-introspect tokens](#fusion-run-introspect-tokens)
  - [fusion-run-introspect why](#fusion-run-introspect-why)
  - [fusion-run-introspect where](#fusion-run-introspect-where)
  - [fusion-run-introspect middleware](#fusion-run-introspect-middleware)

---

## Try it out

*(this assumes you've used a fusion scaffolder such as [create-fusion-app](https://github.com/fusionjs/create-fusion-app))*

### 1. Register plugin

`src/main.js`

```js
import introspect from 'fusion-plugin-introspect';

export default () => {
  //...
  app.register(introspect(app));
};
```

### 2. Run your app

```sh
yarn dev
```

### 3. Inspect with the cli

Some commands to try:

```sh
# list tokens in order of registration
yarn fusion-run-introspect tokens

# display tree of token's dependents and dependencies
yarn fusion-run-introspect why RenderToken

# discover more commands
yarn fusion-run-introspect -h
```

## Full usage example

```js
import App from 'fusion-core';
import introspect from 'fusion-plugin-introspect';

const store = {
  storeSync(data) {
    // Log to stdout and collect data via log-entries, papertrail or similar
    console.log(JSON.stringify(data));
  }
  async store(data, {myMetricsService}) {
    // This is called once the app finishes collecting data
    // We can obtain an arbitrary data storage service (`myMetricsService`) from the DI container
    myMetricsService.emit('node-version', data.meta.nodeVersion);
  }
}

export default () => {
  const app = new App('<h1>Hello world</h1>', v => v);
  app.register(
    introspect(app, {
      deps: {myMetricsService: SomeServiceToken},
      store: !__DEV__ ? store : undefined,
    })
  )
}
```

## Data schema

The `data` that is passed to `store` and `storeSync` follows this schema:

```js
{
  version: string,
  server: [{
    timestamp: number,
    dependencies: [{name: string, stack: string, dependencies: [string]}],
    enhanced: [{name: string}],
  }],
  browser: [{
    timestamp: number,
    dependencies: [{name: string, stack: string, dependencies: [string]}],
    enhanced: [{name: string}],
  }],
  runtime: {
    timestamp: number,
    pid: number,
    nodeVersion: string,
    npmVersion: string,
    yarnVersion: string,
    lockFileType: string,
    dependencies: {[string]: string},
    devDependencies: {[string]: string},
    varNames: [string],
    vars: {[string]: string},
  }
}
```

- `version` - Data schema version
- `server.timestamp` - When server-side DI graph data was collected. Note that this may differ from other timestamps
- `server.dependencies` - A list of tokens and their respective creation stack traces and dependencies
- `server.enhanced` - A list of token names that have been enhanced

- `browser.timestamp` - When client-side DI graph data was collected. Note that this may differ from other timestamps
- `browser.dependencies` - A list of tokens and their respective creation stack traces and dependencies
- `browser.enhanced` - A list of token names that have been enhanced

- `runtime.timestamp` - When DI graph data was collected. Note that this may differ from other timestamps
- `runtime.pid` - The process ID
- `runtime.nodeVersion` - Node version
- `runtime.npmVersion` - NPM version
- `runtime.yarnVersion` - Yarn version
- `runtime.lockFileType` - Either `npm`, `yarn` or `none`
- `runtime.lockFile` - The contents of the lock file
- `dependencies` - The `dependencies` field in `package.json`
- `devDependencies` - The `devDependencies` field in `package.json`
- `varNames` - A list of all defined env var names (but not their values)
- `vars` - A map of env vars, filtered by the `env` option

#### Flow types

```
export type IntrospectionSchema = {
  version: string,
  server: Array<Dependencies>,
  browser: Array<Dependencies>,
  runtime: Metadata,
};
export type Dependencies = {
  timestamp: number,
  dependencies: Array<Dependency>,
  enhanced: Array<{name: string}>,
};
export type Dependency = {
  name: string,
  stack: string,
  dependencies: Array<string>,
};
export type Metadata = {
  timestamp: number,
  pid: number,
  nodeVersion: string,
  npmVersion: string,
  yarnVersion: string,
  lockFileType: string,
  dependencies: {[string]: string},
  devDependencies: {[string]: string},
  varNames: Array<string>,
  vars: {[string]: string},
};
```

---

## API

#### Registration API

##### introspect

```js
import introspect from 'fusion-plugin-introspect';

app.register(introspect(app, {store, env}));
```

- `introspect: (app, {store, env}) => FusionPlugin<void, void>` - creates a Fusion plugin
  - `app: FusionApp` - a Fusion app instance. Usually obtained from `fusion-react` or `fusion-apollo`.
  - `store: {store, storeSync}` - a storage mechanism. Defaults to `fsStore`
    - `store: (data, deps) => Promise<void>` - called when all runtime data is collected successfully
      - `data: Object` - An object that conforms to the [introspection data schema](#data-schema)
      - `deps: Object` - A map of dependencies. You can inject a service to consume the data.
    - `storeSync: data => void` - called at startup time just in case the app crashes before data collection completes. Must not contain asynchronous code. See also the ["Using `'uncaughtException'` correctly"](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly) section in the Node docs. Note that `storeSync` does not receive a `deps` argument because the DI graph may not be resolvable.
      - `data: Object` - An object that conforms to the [introspection data schema](#data-schema)
  - `env: ?Array<string>` - A list of env var names to be collected. Do not collect env vars that contain secrets or other sensitive data. Defaults to `[]`.

#### Storage

##### fsStore

```js
import {fsStore} from 'fusion-plugin-introspect';
```

- `fsStore: {store, storeSync}` - A storage mechanism that saves data to `.fusion/fusion-stats.json`
  - `store: data => Promise<void>` - called when all runtime data is collected successfully. Saves data to a file
    - `data: Object` - An object that conforms to the [introspection data schema](#data-schema)
  - `storeSync: (data) => void` - called at startup time just in case the app crashes before data collection completes. Saves data to a file synchronously
    - `data: Object` - An object that conforms to the [introspection data schema](#data-schema)

#### CLI

You can introspect the Fusion dependency injection (DI) graph through the command line while an app is running.

```
yarn fusion-run-introspect

  Usage
    $ fusion-run-introspect <command> [options]

  Available Commands
    tokens        List of all DI tokens in order of resolution
    why           How a DI token is used
    where         Where a DI token is registered
    middleware    Which tokens are registered w/ middleware and their order

  For more info, run any command with the `--help` flag
    $ fusion-run-introspect tokens --help
    $ fusion-run-introspect why --help

  Options
    -v, --version    Displays current version
    -h, --help       Displays this message
```

##### fusion-run-introspect tokens

```
yarn fusion-run-introspect tokens
```

Lists all Fusion DI tokens and the file/line where they are defined

##### fusion-run-introspect why

```
yarn fusion-run-introspect why <token>
```

Provides various pieces of information about a token:

- whether it is a plugin
  - whether the plugin provides a service
  - whether the plugin contains a middleware
  - where the plugin is created
- where the token is created
- where the token is registered
- what tokens/plugins are used by this plugin
- what tokens/plugins depend on this plugin

##### fusion-run-introspect where

```
yarn fusion-run-introspect where <token>
```

Displays where the token is registered

##### fusion-run-introspect middleware

```
yarn fusion-run-introspect tokens
```

Lists all Fusion middleware in the order that they run
