# fusion-cli

[![Build status](https://badge.buildkite.com/849975159b112300b6a2923f8ab4e58db8d3bf35227cf39a37.svg?branch=master)](https://buildkite.com/uberopensource/fusion-cli)

The CLI interface for Fusion.js

The `fusion-cli` package is responsible for orchestrating compile-time configuration for server and browser bundles, as well as development, test and production variations. It provides a standardized Babel configuration that includes async/await support as well as stage 3+ Ecmascript features.

Due to the complexity involved in configuring many permutations of configurations, Fusion.js does not support custom `webpack.config`. This design decision allows Fusion.js to eventually move away from Webpack if faster and better bundlers become available.

The CLI is also responsible for hot module reloading in development mode, and for running the web server.

### Installation

```sh
yarn add fusion-cli
```

---

### CLI API

* `fusion build [dir] [--test] [--cover] [--production] [--log-level]`: Build your appplication
  * `--test`: Build tests as well as application
  * `--cover`: Build tests (with coverage) as well as application
  * `--production`: Build production assets
  * `--log-level`: Log level to output to console `[default: "info"]`
* `fusion dev [dir] [--port] [--no-hmr] [--test] [--cover] [--log-level]`: Run your application in development
  * `--port`: The port on which the application runs `[default: 3000]`
  * `--no-hmr`: Run without hot modules replacement
  * `--test`: Run tests as well as application
  * `--cover`: Run tests (with coverage) as well as application
  * `--log-level`: Log level to output to console `[default: "info"]`
* `fusion profile [--environment] [--watch] [--file-count]`: Profile your application
  * `--environment`: Either `production` or `development` `[default: "production"]`
  * `--watch`: After profiling, launch source-map-explorer with file watch
  * `--file-count`: The number of file sizes to output, sorted largest to smallest (-1 for all files) `[default: 20]`
* `fusion start [--environment]`: Run your application
  * `--environment`: Which environment/assets to run - defaults to first available assets among `["development", "test", "production"]`
* `fusion test [--watch] [--match] [--coverage] [--env] [--debug] [--updateSnapshot]`: Run tests
  * `--watch`: Automatically run tests when code changes.
  * `--match="somestring"`: Only runs tests against files which match this string.
  * `--coverage`: Collects and outputs test coverage
  * `--env`: Which environments to run tests in. Defaults to "node,jsdom". You may specify only one.
  * `--debug`: Allows you to debug tests using the chrome inspector (chrome://inspect).
  * `--updateSnapshot`: Updates snapshots
