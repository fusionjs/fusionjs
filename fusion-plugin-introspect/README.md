# fusion-plugin-introspect

Collects runtime metadata to aid debugging

---

### Table of contents

- [Usage](#usage)
- [Data schema](#data-schema)
- [API](#api)
  - [Registration API](#registration-api)
  - [Storage](#storage)

---

### Usage

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

### Data schema

The `data` that is passed to `store` and `storeSync` follows this schema:

```js
{
  version: string,
  server: [{
    timestamp: number,
    dependencies: [{name: string, stack: string, dependencies: [string]}],
    enhanced: [string],
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

---

### API

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
