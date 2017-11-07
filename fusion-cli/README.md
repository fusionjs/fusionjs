# fusion-cli

### Installation

```sh
yarn add fusion-cli
```

---

### CLI API

- `fusion build [dir] [--test] [--cover] [--production] [--log-level]`: Build your appplication
  - `--test`: Build tests as well as application
  - `--cover`: Build tests (with coverage) as well as application
  - `--production`: Build production assets
  - `--log-level`: Log level to output to console `[default: "info"]`
- `fusion dev [dir] [--port] [--no-hmr] [--test] [--cover] [--log-level]`: Run your application in development
  - `--port`: The port on which the application runs `[default: 3000]`
  - `--no-hmr`: Run without hot modules replacement
  - `--test`: Run tests as well as application
  - `--cover`: Run tests (with coverage) as well as application
  - `--log-level`: Log level to output to console `[default: "info"]`
- `fusion profile [--environment] [--watch] [--file-count]`: Profile your application
  - `--environment`: Either `production` or `development` `[default: "production"]`
  - `--watch`: After profiling, launch source-map-explorer with file watch
  - `--file-count`: The number of file sizes to output, sorted largest to smallest (-1 for all files) `[default: 20]`
- `fusion start [--environment]`: Run your application
  - `--environment`: Which environment/assets to run - defaults to first available assets among `["development", "test", "production"]`
- `fusion test [--cover] [--watch] [--skip-build]`: Run tests
  - `--cover`: Run tests with coverage
  - `--watch`: Use existing built assets
  - `--skip-build`: Automatically re-profile your application on changes
