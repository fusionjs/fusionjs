# fusion-cli

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The CLI interface for Fusion.js

The `fusion-cli` package is responsible for orchestrating compile-time configuration for server and browser bundles, as well as development, test and production variations. It provides a standardized Babel configuration that includes async/await support as well as stage 3+ Ecmascript features.

Due to the complexity involved in configuring many permutations of configurations, Fusion.js does not support custom `webpack.config`. This design decision allows Fusion.js to eventually move away from Webpack if faster and better bundlers become available. Additionally, it allows Fusion.js to make changes to the internal webpack configuration without the concern of breaking users customizations. If you run into a situation where you feel you need to make a webpack customization, please reach out to us on [slack](https://join.slack.com/t/fusionjs/shared_invite/enQtMzk3NjM0MTg0MTI4LWJhNzVjYjk5ZDVlYWIxZWViMjA3YzE5OTc4YWZkNzBkZmNkYmJkMDYyOGEzODEwMzRmMWExMzc1NDIzMmY2NDQ) or create an issue describing your use case.

The CLI is also responsible for hot module reloading in development mode, and for running the web server.

### Installation

```sh
yarn add fusion-cli
```

---

### CLI API

The CLI API can be most easily run through the Yarn or NPX CLI, e.g. `yarn fusion build` or `npx fusion build`.

- `fusion build [dir] [--production] [--log-level] [--maxWorkers]`
  Builds your application assets

  This command generates transpiled javascript/source map files (aka assets, artifacts) for browser and server. By default it builds development assets, but can also build test and production assets, given the respective flags.

  Build artifacts are stored in the `.fusion` directory.

  - `--production`: Build production assets
  - `--log-level`: Log level to output to console `[default: "info"]`
  - `--skipSourceMaps`: Skip building source maps
  - `--maxWorkers`: Maximum number of workers create by webpack during build process
  - `--stats`: Control verbosity level of build stats output (`full`, `minimal`) `[default: "minimal"]`
  - `--analyze`: Run bundle analyzer for targeted build (`client`, `server`)

  Builds where the `ENABLE_REACT_PROFILER` environment variable is set to `'true'` will enable the [Fusion React Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) in apps deployed to production. (NOTE: using the react profiler will itself slightly degrade performance):

  - `ENABLE_REACT_PROFILER=true fusion build`

- `fusion dev [dir] [--port] [--no-hmr] [--test] [--log-level] [--forceLegacyBuild] [--disablePrompts]`
  Builds development assets and runs the application in development mode

  Note that this command only builds browser artifacts in memory, and it doesn't save them to the filesystem. This allows hot module reloading to occur faster since there's no performance cost due to I/O access.

  - `--port`: The port on which the application runs `[default: 3000]`
  - `--no-hmr`: Run without hot modules replacement
  - `--test`: Run tests as well as application
  - `--log-level`: Log level to output to console `[default: "info"]`
  - `--forceLegacyBuild`: Force enable legacy build. By default not compiled in dev.
  - `--exitOnError`: Exit the process if a compiliation error occurs.
  - `--preserveNames`: Disable name mangling during script minification
  - `--disablePrompts`: Disable command-line prompts. Useful for CI environment
  - `--stats`: Control verbosity level of build stats output (`full`, `minimal`) `[default: "minimal"]`
  - `--analyze`: Run bundle analyzer for targeted build (`client`, `server`)
  - `--unsafeCache`: Use webpack's unsafeCache to boost incremental build performance. Any filesystem alterations affecting module resolution will be ignored, and require dev process restart
  - `--useModuleScripts`: Use Module Scripts of `<script type="module">` instead of `<script>` for client bundles

  `fusion dev` process is terminated gracefully upon receiving `SIGTERM` and `SIGINT` signals, allowing time to complete all routine tasks (e.g.,  cache persistence etc.), and cleanup all used resources. Use `FUSION_CLI_TERMINATION_GRACE_PERIOD=<time_ms>` environment variable to control the grace period timeout, forcing the process to exit should tasks take long time to finish. _Note: setting this environment variable to `0` will make the process exit immediately_
  - `FUSION_CLI_TERMINATION_GRACE_PERIOD=<time_ms> fusion dev`:

- `fusion start [--environment]`
  Runs your application, assuming you have previously built them via `fusion build`. Note that build artifacts must be saved to disk (i.e. this command will fail if you use `fusion dev` to build artifacts instead of `fusion build`.

  - `--environment`: Which environment/assets to run - defaults to first available assets among `["development", "production"]`
  - `--useModuleScripts`: Use `<script type="module">` and `<script nomodule>` instead of user-agent checks for modern/legacy bundle loading

- `fusion test`
  This command is being deprecated, please use `jest` directly for which base configuration is provided via `fusion-cli/build/jest/jest-config`:

  ```js
  // jest.config.js

  module.exports = require('fusion-cli/build/jest/jest-config');
  ```

  The last published version of this command options can be found [here](https://github.com/fusionjs/fusionjs/blob/1e48e9077693d0e2bac7c50f008f7b6258db150d/fusion-cli/README.md#:~:text=fusion%20test%20[options]).

### Webpack stats.json file

Building an app generates a `.fusion/stats.json` file, which by default includes very basic information about the webpack build. You can build using `--stats=full` option, which will generate more verbose stats file that can be used with [`webpack-bundle-analyzer`](https://www.npmjs.com/package/webpack-bundle-analyzer), or other bundle analyzer that can read webpack stats output.
