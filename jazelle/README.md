# Jazelle

Incremental, cacheable builds for large Javascript monorepos. Uses [Bazel](https://bazel.build)

---

- Getting started
  - [Why use Jazelle](#why-use-jazelle)
  - [Setup a monorepo](#setup-a-monorepo)
  - [Typical usage](#typical-usage)

- Reference
  - [CLI](#cli)
  - [API](#api)
  - [Configuration](#configuration)
  - [Bazel rules](#bazel-rules)

- Misc
  - [Yarn equivalents](#yarn-equivalents)
  - [Bazel equivalents](#bazel-equivalents)
  - [Monorepo-wide static analysis](#monorepo-wide-static-analysis)
  - [Contributing](CONTRIBUTING.md)

---

## Why use Jazelle

Jazelle is designed for large organizations where different teams own different projects within a monorepo, and where projects depend on compiled assets from other projects in the monorepo. In terms of developer experience, it's meant to be a low-impact drop-in replacement for common day-to-day web stack commands such as `yarn add`, `yarn build` and `yarn test`.

Jazelle leverages Bazel for incremental/cacheable builds and should be able to integrate with Bazel rules from non-JS stacks. This is helpful if the rest of your organization is also adopting Bazel, especially if others in your organization are already investing into advanced Bazel features such as distributed caching. Jazelle can also be suitable if you develop libraries and want to test for regressions in downstream projects as part of your regular development workflow.

Due to its integration w/ Bazel, Jazelle can be a suitable solution if long CI times are a problem caused by running too many tests.

Jazelle can also be a suitable solution if the frequency of commits affecting a global lockfile impacts developer velocity.

If you just have a library of decoupled components, Jazelle might be overkill. In those cases, you could probably get away with using a simpler solution, such as Yarn workspaces, Lerna or Rush.

---

## Setup a monorepo

- [Scaffold a workspace](#scaffold-a-workspace)
- [Configure Bazel rules](#configure-bazel-rules)
- [Edit manifest.json file](#edit-manifestjson-file)
- [Setup .gitignore](#setup-gitignore)
- [What to commit to version control](#what-to-commit-to-version-control)

### Scaffold a workspace

```sh
mkdir my-monorepo
cd my-monorepo
jazelle init
```

The `jazelle init` command generates Bazel `WORKSPACE`, `BUILD.bazel` and `.bazelversion` files, along with the Jazelle configuration file `manifest.json`. If you are setting up Jazelle on an existing Bazel workspace, see [Bazel rules](#bazel-rules).

### Configure Bazel rules

Check that the `.bazelversion` file at the root of your repo contains your desired Bazel version. For example:

```
0.27.0
```

Check that the `WORKSPACE` file at the root of your repo is using the desired versions of Jazelle, Node and Yarn:

```python
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-[version].tgz",
  sha256 = "SHA 256 goes here",
  strip_prefix = "package",
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "10.16.3",
  node_sha256 = {
    "mac": "6febc571e1543c2845fa919c6d06b36a24e4e142c91aedbe28b6ff7d296119e4",
    "linux": "d2271fd8cf997fa7447d638dfa92749ff18ca4b0d796bf89f2a82bf7800d5506",
    "windows": "19aa47de7c5950d7bd71a1e878013b98d93871cc311d7185f5472e6d3f633146",
  },
  yarn_version = "1.19.1",
  yarn_sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf",
)
```

Jazelle SHA256 checksum can be computed through the following command:

```sh
curl -fLs https://registry.yarnpkg.com/jazelle/-/jazelle-[version].tgz | openssl sha256
```

Node SHA256 checksums can be found at `https://nodejs.org/dist/v[version]/SHASUMS256.txt`. Use the checksums for these files:

- `node-v[version]-darwin-x64.tar.gz`
- `node-v[version]-linux-x64.tar.xz`
- `node-v[version]-win-x64.zip`

Yarn SHA256 checksum can be computed through the following command:

```sh
curl -fLs https://github.com/yarnpkg/yarn/releases/download/v[version]/yarn-[version].js | openssl sha256
```

Double check that the `BUILD.bazel` at the root of your repo contains this code:

```python
load("@jazelle//:build-rules.bzl", "jazelle")

jazelle(name = "jazelle", manifest = "manifest.json")
```

### Edit manifest.json file

Create a file called `manifest.json` at the root of the monorepo:

```json
{
  "projects": [
    "path/to/project-1",
    "path/to/project-2"
  ]
}
```

The `projects` field in this file should list every project that you want Jazelle to manage.

### Setup .gitignore

Add the following entries to .gitignore

```
third_party/jazelle/temp
bazel-*
```

### What to commit to version control

**DO** commit

- `manifest.json` file
- `WORKSPACE` file
- `BUILD.bazel` files
- `.bazelversion` file
- `.bazelignore` file
- `third_party/jazelle/BUILD.bazel` file
- `third_party/jazelle/scripts` folder
- projects' `yarn.lock` files

**DO NOT** commit

- `/third_party/jazelle/temp` folder
- `node_modules` folders
- `bazel-[*]` folders

---

## Typical usage

- [CLI installation](#cli-installation)
  - [Upgrading](#upgrading)
- [Onboarding a project](#onboarding-a-project)
  - [Troubleshooting a failed onboarding](#troubleshooting-a-failed-onboarding)
- [Day-to-day usage](#day-to-day-usage)
- [Using Bazel](#using-bazel)
- [Getting out of bad states](#getting-out-of-bad-states)

### CLI installation

Install the CLI globally:

```sh
# install
yarn global add jazelle

# verify it's installed
jazelle version
```

If the repo is already scaffolded, you can use the script in it:

```
third_party/jazelle/scripts/install-run-jazelle.sh version
```

#### Upgrading

```sh
yarn global upgrade jazelle
```

If upgrading fails, it's probably because you didn't follow the installation instructions. In that case, try reinstalling:

```sh
npm uninstall jazelle --global
yarn global remove jazelle
yarn global add jazelle
```

It's ok for users to have different versions of Jazelle installed. Jazelle runs all commands via Bazelisk, which enforces that the Bazel version specified in `.bazelversion` is used. Bazel, in turn, enforces that the Node and Yarn versions specified in `WORKSPACE` are used.

### Onboarding a project

- Copy and paste your project into the monorepo, at a desired path.
- Open `manifest.json` and add the path to your project.
- Ensure your project's package.json has `scripts` fields called `build`, `test`, `lint` and `flow`.
- Optionally, verify that your dependency versions match the dependency versions used by other projects in the monorepo. To verify, run `jazelle check`. To upgrade a dependency, run `jazelle upgrade [the-dependency] --version [desired-version]` from your project folder.
- Run `jazelle install` from your project folder to generate Bazel BUILD files, and install dependencies. This may take a few minutes the first time around since Bazel needs to install itself and its dependencies. Subsequent calls to `jazelle install` will be faster.
- Run `jazelle test` to verify that your project builds and tests pass. Optionally run `jazelle run lint` and `jazelle run flow`.

#### Troubleshooting a failed onboarding

If building your project fails, open the BUILD.bazel files and double check that the `dist` argument in the `web_library` call points to the folder where you expect compiled assets to be placed. This folder is often called `dist` or `bin`. Note that BUILD.bazel files may also be created in dependencies' folders, if they did not already have them. Use version control to identify where newly generated BUILD.bazel files were created and review their `dist` arguments.

##### EPERM

If you get permission errors (EPERM), it's likely because the Bazel sandbox disables write permissions on input files and there are compiled assets in your source code tree that are being picked up by the `glob` call in the `BUILD.bazel` file.

Delete the compiled assets that are generated by your NPM `build` script. You could also use the `exclude` argument of the `glob` in your BUILD.bazel file to help team members avoid the pitfall.

```python
web_library(
    name = "library",
    deps = [
        "//third_party/jazelle:node_modules",
    ],
    srcs = glob(["**/*"], exclude = ["dist/**"]),
)
```

##### Corrupted yarn.lock

If you get an error about a corrupted `yarn.lock` file, delete the `yarn.lock` file from the offending project. Note that the error may refer to a local dependency of your project.

Then, run `jazelle install` from your project folder.

##### Module not found

This error happens if running an app and Node is unable to find the dependency when `require`ing it. It can also happen if static analysis tooling depends on build output of dependencies and you use a command that bypasses Bazel.

- Check that the module is actually declared in package.json.
- Check if the module is a peer dependency. If so, ensure it's also a devDependency (or a regular dependency).
- Try `jazelle purge && jazelle install` from your project folder.
- Ensure that your NPM `build` script does not run other tools (e.g. lint).
- If you ran a command that is not documented in `bazel --help` (e.g. `jazelle lint`), try running the Bazel-enabled equivalent (`jazelle run lint`) instead.

#### Script must exist

If you get an error saying a script must exist, make sure your project has the relevant NPM script. For example, if you ran `jazelle build`, make sure your package.json has a `scripts.build` field. If it doesn't need to have one, simply create one with an empty value. If you do have that field, one of your project's local dependencies may be missing it.

### Day-to-day usage

Navigate to a project in the monorepo, then use [CLI commands](#cli), similar to how you would with `yarn`

```sh
# navigate to your project folder
cd path/to/project-1

# generates Bazel build files for relevant projects, if needed
jazelle install

# start project in dev mode
jazelle run

# run tests
jazelle test

# lint
jazelle run lint

# type check
jazelle run flow

# add dependency
jazelle add react@16.8.2
```

### Using Bazel

Jazelle provides six build rules: `jazelle`, `web_library`, `web_binary`, `web_executable`, `web_test` and `flow_test`.

- `jazelle` allows you to run Jazelle as a Bazel target (e.g. if you have Bazel installed globally, but not Jazelle)
- `web_library` defines what source files and dependencies comprise a project. The `jazelle install` command automatically generates a `web_library()` declaration with the correct list of dependencies (by looking into the project's `package.json`)
- `web_binary` builds a project and runs a project
- `web_executable` runs a project (without building)
- `web_test` runs a test script for a project
- `flow_test` type checks the project

If you add or remove an entry in your package.json that points to a local project, Jazelle updates the `yarn.lock` file and adds the dependency to the `deps` field of the `web_library` declation in your project's BUILD.bazel file. In Bazel, dependencies are declared using label syntax. A label consists of a `//` followed by the path to the project, followed by a `:` followed by the `name` field of the `web_library` declaration of the project.

For example, if you have a project in folder `path/to/my-project` whose `web_library` has `name = "hello"`, then its label is `//path/to/my-project:hello`.

```python
# an example BUILD.bazel file for a project with a dependency
web_library(
  name = "my-project",
  deps = [
    # depend on a project that lives under ./my-other-project
    "//my-other-project:my-other-project",
  ],
  srcs = glob(["**/*"]),
  dist = "dist",
)
```

### Getting out of bad states

While Jazelle attempts to always keep the workspace in a good state, it may be possible to get into a corrupt state, for example, if you manually edit system files (such as generated files in the `/third_party/jazelle/temp` folder).

Another way to get into a bad state is to change the name of a project. Currently, Jazelle does not support re-syncing depenency graphs after project name changes, since this use case is rare and the required checks would slow down CLI commands.

If you get into a bad state, here are some things you can try:

- Run `jazelle purge` and run `jazelle install` from your project folder again
- Delete the `/third_party/jazelle/temp` folder and run `jazelle install`
- Undo changes to `[your-project]/BUILD.bazel` and run `jazelle install`
- Verify that `manifest.json` is valid JSON

---

## CLI

- [`Shorthands`](#shorthands)
- [`jazelle --help`](#jazelle---help)
- [`jazelle version`](#jazelle-version)
- [`jazelle init`](#jazelle-init)
- [`jazelle install`](#jazelle-install)
- [`jazelle ci`](#jazelle-ci)
- [`jazelle add`](#jazelle-add)
- [`jazelle remove`](#jazelle-remove)
- [`jazelle upgrade`](#jazelle-upgrade)
- [`jazelle dedupe`](#jazelle-dedupe)
- [`jazelle purge`](#jazelle-purge)
- [`jazelle check`](#jazelle-check)
- [`jazelle chunk`](#jazelle-chunk)
- [`jazelle changes`](#jazelle-changes)
- [`jazelle plan`](#jazelle-plan)
- [`jazelle batch`](#jazelle-batch)
- [`jazelle build`](#jazelle-build)
- [`jazelle dev`](#jazelle-dev)
- [`jazelle test`](#jazelle-test)
- [`jazelle lint`](#jazelle-lint)
- [`jazelle flow`](#jazelle-flow)
- [`jazelle start`](#jazelle-start)
- [`jazelle bazel`](#jazelle-bazel)
- [`jazelle node`](#jazelle-node)
- [`jazelle yarn`](#jazelle-yarn)
- [`jazelle exec`](#jazelle-exec)
- [`jazelle each`](#jazelle-each)
- [`jazelle bump`](#jazelle-bump)
- [`jazelle doctor`](#jazelle-doctor)
- [`jazelle setup`](#jazelle-setup)
- [Running NPM scripts](#running-npm-scripts)
- [Colorized errors](#colorized-errors)

### Shorthands

- Commands that take a `--name` argument can omit the word `--name`. For example, `jazelle add foo` is equivalent to `jazelle add --name foo`.
- Commands that take a `--cwd` argument can be run without it from the project folder. For example, `jazelle add foo --cwd my-project` is equivalent to `cd my-project && jazelle add foo`.

### `jazelle --help`

Displays help information

### `jazelle version`

Displays installed version. You may see two values: `actual` is the version of Jazelle being run. `system` is the version of Jazelle that is globally installed in the machine. Note that they may be different because the `actual` version is set in a repository's `WORKSPACE` file.

### `jazelle init`

Scaffolds required workspace files

### `jazelle install`

- Downloads external dependencies and links local dependencies.
- Generates [Bazel](https://bazel.build/) BUILD files if they don't already exist for the relevant projects.
- Updates yarn.lock files if needed.

`jazelle install --cwd [cwd]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle ci`

Downloads external dependencies and links local dependencies. Does not create or modify source files. Useful for CI checks.

`jazelle ci --cwd [cwd]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle add`

Adds a dependency to the project's package.json, syncing the `yarn.lock` file, and the matching `web_library` rule in the relevant BUILD.bazel file if needed

`jazelle add --name [name] --dev --cwd [cwd]`
`jazelle add [name] --dev --cwd [cwd]`

- `--name` - Name of dependency and it's version to add. ie., `foo@1.2.3`. If version is not specified, defaults to `npm info [name] version` for 3rd party packages, or the local version for local packages.
- `--dev` - Whether to install as a devDependency. Default to `false`
- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle remove`

Removes a dependency from the project's package.json, syncing the `yarn.lock` file, and the matching `web_library` rule in the relevant BUILD.bazel file if needed

`jazelle remove --name [name] --cwd [cwd]`
`jazelle remove [name] --cwd [cwd]`

- `--name` - Name of dependency to remove
- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle upgrade`

Upgrades a dependency across all local projects that use it

`jazelle upgrade --name [name] --from [from]`
`jazelle upgrade [name] --from [from]`

- `name` - Name of dependency and it's version to upgrade to. ie., `foo@1.2.3`. If version is not specified, defaults to `npm info [name] version` for 3rd party packages, or the local version for local packages.
- `--from` - Only upgrade projects where the current minimum version of the dep is in range of the `from` version range. Optional.

### `jazelle dedupe`

Dedupe transitive dependencies in projects' yarn.lock files

`jazelle dedupe`

### `jazelle purge`

Removes generated files (i.e. `node_modules` folders and bazel output files)

`jazelle purge`

### `jazelle check`

Shows a report of out-of-sync top level dependencies across projects

`jazelle check --json`

- `--json` - Whether to output as JSON. This is useful if you want to pipe the report to `jq` (e.g `jazelle changes --json | jq .jest` to see report for only `jest`)

```js
// sample report
{
  "valid": false,
  "policy": {
    "lockstep": false,
    "exceptions": [
      "my-dependency"
    ],
  },
  "reported": {
    "my-dependency": {
      "1.0.0": [
        "my-project-1",
        "my-project-2",
      ]
    }
  }
}
```

### `jazelle chunk`

Prints a glob pattern representing a chunk of files matching a given list of glob patterns. Useful for splitting tests across multiple CI jobs.

Glob patterns are matched via [minimatch](https://github.com/isaacs/minimatch)

`jazelle chunk --projects [projects] --jobs [jobs] --index [index]`

- `--patterns` - A pipe separated list of glob patterns. Patterns can be negated by prepending a `!` (e.g. `!tests/fixtures/*`)
- `--jobs` - Divide the files among this number of chunks
- `--index` - Which chunk. For example, if `patterns` find 10 files, jobs is `5` and index is `1`, then the third and fourth files will be returned as a `.*/file-3.js|.*/file-4.js` pattern.

For example, it's possible to parallelize Jest tests across multiple CI jobs via a script like this:

```sh
jest --testPathPattern=$(jazelle chunk --projects "tests/**/*|!tests/fixtures/**/*" --jobs $CI_JOB_COUNT --index $CI_JOB_INDEX)
```
### `jazelle changes`

List projects that have changed since the last git commit.

`jazelle changes`

- `--files` - A file containing a list of changed files, one per line. Defaults to stdin
- `--format` - 'targets' or 'dirs'. Defaults to 'targets'. Determine whether to return directory paths or bazel targets

The `files` file can be generated via git:

```sh
git diff-tree --no-commit-id --name-only -r HEAD origin/master > files.txt
jazelle changes files.txt
```

Bazel targets can be tested via the `bazel test [target]` command.

### `jazelle plan`

List an efficient grouping of test jobs to run on a server cluster.

For example, if `jazelle changes` reports 8 projects have changed, and there are 4 cloud nodes, this command will create 4 groupings, each containing the `test`, `lint` and `flow` jobs for 2 projects. If they are distributed over 24 nodes, the command will create 24 groupings, one for each job.

`jazelle plan [targets] --nodes [nodes]`

- `[targets]` - A file containing a list of targets (typically from `jazelle changes`). Defaults to stdin
- `--nodes` - The number of nodes (i.e. cloud machines). Defaults to 1

### `jazelle batch`

Runs a plan from `jazelle plan`, parallelizing tests across CPUs

`jazelle batch [plan] --index [index]`

- `[plan]` - A file containing a plan (typically from `jazelle plan`). Defaults to stdin
- `--index` - Which group of tests to execute. Defaults to 0
- `--cores` - Number of cpus to use. Defaults to `os.cpus().length`

### `jazelle build`

Builds a project and its dependencies in topological order. Calls `scripts.build` in package.json. See also [direct Bazel usage](#direct-bazel-usage)

`jazelle build --cwd [cwd]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle dev`

Runs a project in development mode. Calls `scripts.dev` in package.json

`jazelle dev --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments to pass to the dev script

### `jazelle test`

Tests a project. Calls `scripts.test` in package.json

`jazelle test --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments to pass to the test script

### `jazelle lint`

Lints a project. Calls `scripts.lint` in package.json

`jazelle lint --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments to pass to the lint script

### `jazelle flow`

Type-checks a project. Calls `scripts.flow` in package.json

`jazelle flow --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments to pass to the flow script

### `jazelle start`

Runs a project. Calls `scripts.start` in package.json

`jazelle start --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments to pass to the start script

### `jazelle bin-path`

Print the local path of a binary

`jazelle bin-path [name]`

- `name` - 'bazel', 'node', or 'yarn'

### `jazelle bazel`

Runs a Bazel command

`jazelle bazel --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of Bazel arguments

### `jazelle node`

Runs a Node script

`jazelle node --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of arguments

### `jazelle yarn`

Runs a Yarn command

`jazelle yarn --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - A space separated list of Yarn arguments

### `jazelle exec`

Runs a bash script

`jazelle exec --cwd [cwd] [args...]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`
- `args` - List of shell args

### `jazelle each`

Runs a bash script in all projects, parallelizing across CPUs

`jazelle each --cores [cores] [...args]`

- `cores` - Number of cores to use. Defaults to `os.cpus().length - 1`
- `args` - List of shell args

### `jazelle bump`

Bumps a package and its dependencies to the next version. It also updates all matching local packages to match

`jazelle bump [type] [--frozePackageJson] --cwd [cwd]`

- `type` - Must be one of `major`, `premajor`, `minor`, `preminor`, `patch`, `prepatch`, `prerelease` or `none`
- `frozenPackageJson` - If this flag is present, throws if changes to package.json are required. Useful for warning users to commit version bumps before publishing
- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

The bump command is idempotent, i.e. running it twice without publishing results in the same versions.

### `jazelle doctor`

Suggests fixes for some types of issues

`jazelle doctor --cwd [cwd]`

- `--cwd` - Project folder (absolute or relative to shell `cwd`). Defaults to `process.cwd()`

### `jazelle setup`

Installs Jazelle hermetically. Useful for priming CI.

`jazelle setup`

### Running NPM scripts

You can run NPM scripts via `jazelle yarn`. For example, if you have a script called `upload-files`, you can call it by running `jazelle yarn upload-files`.

### Colorized errors

If you want commands to display colorized output, run their respective NPM scripts directly without going through Bazel (e.g. `jazelle yarn lint` instead of  `jazelle lint`). This will preserve stdout/stderr colors.

---

## API

`const {runCLI, install, add, remove, upgrade, dedupe, check, build, test, run} = require('jazelle')`

- [runCLI](#runcli)
- [version](#version)
- [scaffold](#scaffold)
- [install](#install)
- [add](#add)
- [remove](#remove)
- [upgrade](#upgrade)
- [dedupe](#dedupe)
- [purge](#purge)
- [check](#check)
- [chunk](#chunk)
- [changes](#changes)
- [plan](#plan)
- [batch](#batch)
- [build](#build)
- [dev](#dev)
- [test](#test)
- [lint](#lint)
- [flow](#flow)
- [bazel](#bazel)
- [node](#node)
- [yarn](#yarn)
- [exec](#exec)
- [each](#each)
- [bump](#bump)
- [doctor](#doctor)
- [getRootDir](#getRootDir)

### `runCLI`

Runs a CLI command given a list of arguments

`let runCLI: (args: Array<string>) => Promise<void>`

- `args` - An array of arguments, e.g. `['build', '--cwd', cwd]`

### `version`

The currently installed version. Note: this is a property, not a function.

`let version: string`

### `scaffold`

Generates Bazel files required to make Jazelle run in a workspace

`let version: ({cwd: string}) => Promise<void>`

- `cwd` - Project folder (absolute path)

### `install`

- Downloads external dependencies and links local dependencies.
- Generates [Bazel](https://bazel.build/) BUILD files if they don't exist for the relevant projects.
- Updates yarn.lock files if needed.

`let install: ({root: string, cwd: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)

### `ci`

Downloads external dependencies and links local dependencies. Does not create or modify source files. Useful for CI checks.

`let ci: ({root: string, cwd: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)

### `add`

Adds a dependency to the project's package.json, syncing the `yarn.lock` file, and the matching `web_library` rule in the relevant BUILD.bazel file if needed

`let add: ({root: string, cwd: string, name: string, version: string, dev: boolean}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `name` - Name of dependency to add and its version (e.g. `foo@^1.2.3`). If version is not specified, defaults to `npm info [name] version` for 3rd party packages, or the local version for local packages.
- `dev` - Whether to install as a devDependency
- `cwd` - Project folder (absolute path)

### `remove`

Removes a dependency from the project's package.json, syncing the `yarn.lock` file, and the matching `web_library` rule in the relevant BUILD.bazel file if needed

`let remove: ({root: string, cwd: string, name: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `name` - Name of dependency to remove
- `cwd` - Project folder (absolute path)

### `upgrade`

Upgrades a dependency across all local projects that use it

`let upgrade: ({root: string, name: string, version: string, from: string}) => Promise<void>`

- `name` - Name of dependency to upgrade and its version range (e.g. `foo@^1.2.3`). If version is not specified, defaults to `npm info [name] version` for 3rd party packages, or the local version for local packages.
- `from` - Only upgrade projects where the current minimum version of the dep is in range of the `from` version range. Optional.

### `dedupe`

Dedupe transitive dependencies in projects' yarn.lock files

`let dedupe: ({root: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)

### `purge`

Removes generated files (i.e. `node_modules` folders and bazel output files)

`let purge: ({root: string}) => Promise<void>`

### `check`

Returns a report of out-of-sync top level dependencies across projects

```js
// sample report
{
  "valid": false,
  "policy": {
    "lockstep": false,
    "exceptions": [
      "my-dependency"
    ],
  },
  "reported": {
    "my-dependency": {
      "1.0.0": [
        "my-project-1",
        "my-project-2",
      ]
    }
  }
}
```

```js
type VersionPolicy = {
  lockstep: boolean,
  exceptions: Array<string>,
}
type Report = {
  valid: string,
  policy: {
    lockstep: boolean,
    exceptions: Array<string>
  },
  reported: {[string]: {[string]: Array<string>}},
}

let check: ({root: string, projects: Array<string>, versionPolicy: VersionPolicy}) => Promise<Report>
```

- `root` - Monorepo root folder (absolute path)

### `chunk`

Returns a glob pattern representing a chunk of files matching a given list of glob patterns. Useful for splitting tests across multiple CI jobs.

Glob patterns are matched via [minimatch](https://github.com/isaacs/minimatch)

`let chunk: ({root: string, patterns: Array<string>, jobs: number, index: number}) => Promise<string>`

- `root` - Monorepo root folder (absolute path)
- `patterns` - A list of glob patterns. Patterns can be negated by prepending a `!` (e.g. `!tests/fixtures/*`)
- `jobs` - Divide the files among this number of chunks
- `index` - Which chunk. For example, if `patterns` find 10 files, jobs is `5` and index is `1`, then the third and fourth files will be returned as a `.*/file-3.js|.*/file-4.js` pattern.

For example, it's possible to parallelize Jest tests across multiple CI jobs via a script like this:

```sh
jest --testPathPattern=$(node -e "console.log(require('jazelle').chunk({projects: ['tests/**/*', '!tests/fixtures/**/*'], jobs: $CI_JOB_COUNT, index: $CI_JOB_INDEX}))")
```

### `changes`

List projects that have changed since the last git commit.

`let changed: ({root: string, files: string, type: string}) => Promise<Array<string>>`

- `root` - Monorepo root folder (absolute path)
- `files` - The path to a file containing a list of changed files, one per line
- `format` - 'targets' or 'dirs'. Defaults to 'targets'. Determine whether to return directory paths or bazel targets

The `files` file can be generated via git:

```sh
git diff-tree --no-commit-id --name-only -r HEAD origin/master > files.txt
```

Bazel targets can be tested via the `bazel test [target]` command.

### `plan`

List an efficient grouping of test jobs to run on a server cluster.

For example, if `changes` reports 8 projects have changed, and there are 4 servers, this function will create 4 groupings, each containing the `test`, `lint` and `flow` jobs for 2 projects.

```js
type PayloadMetadata = {type: string, dir: string, action: string}

let plan: ({root: string, data: Array<string>, nodes: number}) => Promise<Array<Array<PayloadMetadata>>>
```

- `root` - Monorepo root folder (absolute path)
- `data` - A report of targets (typically from the `changes` method)
- `nodes` - The number of nodes (i.e. cloud machines)

### `batch`

Runs a plan from `jazelle plan`, parallelizing tests across CPUs

```js
type DirTestMetadata = {dir: string, script: string}
type BazelTestMetadata = {target: string}
type TestMetadata = DirTestMetadata | BazelTestMetadata
type TestGroup = Array<TestMetadata>

let batch: ({root: string, data: Array<TestGroup>, index: number, cores: number}) => Promise<void>
```

- `root` - Monorepo root folder (absolute path)
- `plan` - A file containing a plan (typically from `jazelle plan`). Defaults to stdin
- `index` - Which group of tests to execute
- `cores` - Number of cpus to use. Defaults to `os.cpus().length`

### `build`

Builds a projects and its dependencies in topological order. Calls `scripts.build` in package.json

`let build: ({root: string, cwd: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)

### `test`

Tests a project. Calls `scripts.test` in package.json

`let test: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - A list of arguments to pass to the test script

### `dev`

Runs a project in development mode. Calls `scripts.dev` in package.json

`let dev: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - A list of arguments to pass to the dev script

### `lint`

Lints a project. Calls `scripts.lint` in package.json

`let lint: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - A list of arguments to pass to the lint script

### `flow`

Type-checks a project. Calls `scripts.flow` in package.json

`let flow: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - A list of arguments to pass to the flow script

### `start`

Runs a project. Calls `scripts.start` in package.json

`let start: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - A list of arguments to pass to the start script

### `binPath`

Print the local path of a binary

`let binPath: = (name: 'bazel' | 'node' | 'yarn') => string`

- `name` - 'bazel', 'node', or 'yarn'

### `bazel`

Runs a Bazel command

`let bazel: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - List of Bazel args

### `node`

Runs a Node script

`let node: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `cwd` - Project folder (absolute path)
- `args` - List of args

### `yarn`

Runs a Yarn command

`let yarn: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `cwd` - Project folder (absolute path)
- `args` - List of Yarn args

### `exec`

Runs a bash script

`let exec: ({root: string, cwd: string, args: Array<string>}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `args` - List of shell args

### `each`

Runs a bash script in all projects, parallelizing across CPUs

`let each: ({root: string, args: Array<string>, cores: string}) => Promise<void>`

- `cwd` - Project folder (absolute path)
- `args` - List of shell args
- `cores` - Number of cores to use. Defaults to `os.cpus().length - 1`

### `bump`

Bumps a package and its dependencies to the next version. It also updates all matching local packages to match

`let bump = ({root: string, cwd: string, type: string, frozenPackageJson?: boolean})`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)
- `type` - Must be one of `major`, `premajor`, `minor`, `preminor`, `patch`, `prepatch`, `prerelease` or `none`
- `frozenPackageJson` - If true, throws if changes to package.json are required. Useful for warning users to commit version bumps before publishing. Defaults to false.

The bump command is idempotent, i.e. running it twice without publishing results in the same versions.

### `doctor`

Suggests fixes for some types of issues

`let doctor: ({root: string, cwd: string}) => Promise<void>`

- `root` - Monorepo root folder (absolute path)
- `cwd` - Project folder (absolute path)

### `getRootDir`

Finds the absolute path of the monorepo root folder

`let getRootDir: ({dir: string}) => Promise<string>`

- `dir` - Any absolute path inside the monorepo

---

## Configuration

- [Projects](#projects)
- [Workspace](#workspace)
- [Installation hooks](#installation-hooks)
- [Version policy](#version-policy)
- [Build file template](#build-file-template)

Note: The `manifest.json` file does **not** allow comments; they are present here for informational purposes only.

```js
{
  // List of active projects in the monorepo
  "projects": [
    // paths to projects, relative to monorepo root
    "path/to/project-1",
    "path/to/project-2",
    // ...
  ],
  // Optional workspace mode
  "workspace": "sandbox",
  // Optional installation hooks
  "hooks": {
    "preinstall": "echo before",
    "postinstall": "echo after",
  },
  // Optional version policy
  "versionPolicy": {
    "lockstep": true,
    "exceptions": [
      "foo"
    ]
  },
  // Optional rule name to use when auto-updating target `deps` in BUILD.bazel
  "dependencySyncRule": "my_repo_target",
}
```

### Projects

Projects paths must be listed in the `projects` field of the `manifest.json` file. Paths must be relative to the root of the monorepo.

```js
{
  "projects": [
    "path/to/project-1",
    "path/to/project-2",
  ],
}
```

### Workspace

The `workspace` field enables Bazel if set to `sandbox`, or uses a pure JS implementation if set to `host`. Defaults to `host`.

The difference between the two modes is that `host` mode lets you build projects even if you don't specify all of your non-NPM dependencies. An example of a non-NPM dependency is a configuration file outside of the project's folder (e.g. if you are implementing consistent configuration across projects). In `sandbox` mode, you must add this file to the `deps` field of the `web_library` rule in the project's `BUILD.bazel` file. In `host` mode, Jazelle will let you build your project without looking at `BUILD.bazel` files and without nagging about the fact that the configuration file was not explicitly specified as a dependency.

Note that `host` mode is only meant to be used to help importing projects. In `host` mode, dependency graph resolution is only guaranteed for dependencies tracked via package.json. Changes in dependencies that tracked exclusively in BUILD files and/or untracked dependencies are not accounted for when determining when a build cache needs to be invalidated, and may result in overly aggressive caching despite changes that affect a project.

Also note that currently, `jazelle changes` will only report changes that Bazel can detect. This means that if you never used `sandbox` mode, it will not report any changes.

It's strongly recommended that you use `sandbox` mode.

### Installation hooks

Installation hooks run shell scripts before/after dependency installation.

```json
{
  "hooks": {
    "preinstall": "echo before",
    "postinstall": "echo after",
  }
}
```

### Version policy

The version policy structure specifies which direct dependencies must be kept in the same version in all projects that use them within the monorepo.

The version policy is enforced when running `jazelle install`, `jazelle add`, `jazelle remove` and `jazelle upgrade`.

If you change the version policy, it's your responsibility to run `jazelle check` to ensure that projects conform to the new policy, and to run `jazelle upgrade` to fix version policy violations.

```json
{
  "versionPolicy": {
    "lockstep": true,
    "exceptions": [
      "foo"
    ]
  }
}
```

The `lockstep` field indicates whether ALL dependencies should be kept in the same version.

The `exceptions` field is a list of package names that should ignore the `lockstep` policy. For example, if `lockstep` is true and `exceptions` includes a package named `foo`, all dependency versions must be in lockstep, except `foo`. Conversely, if `lockstep` is false, and `exceptions` include a package `foo`, then all projects that use `foo` must use the same version of `foo`, but are free to use any version of any other package.

It's recommended that you set the policy to the following:

```json
{
  "versionPolicy": {
    "lockstep": true,
  }
}
```

You should avoid adding exceptions if using this policy.

Here's an alternative policy that may be more pragmatic for large existing codebases where only some packages are kept up-to-date by a platform team:

```json
{
  "versionPolicy": {
    "lockstep": false,
    "exceptions": [
      "foo",
      "bar"
    ]
  }
}
```

### Build file template

The `third_party/jazelle/build-file-template.js` file should be a js file that exports a named export called `template`.

```js
module.exports.template = async ({name, path, label, dependencies}) => `# a BUILD.bazel template`
```

`let template: ({name: string, path: string, label: string, dependencies: Array<string>}) => Promise<string>`

- `name` - The shorthand name of the target. For example, if the path to the project is `path/to/foo`, `name` is `foo`
- `path` - The project's path, relative to the monorepo root
- `label` - The fully qualified Bazel label. For example `//path/to/foo:foo`
- `dependencies` - A list of labels for Bazel targets that are dependencies of the current rule

Here's an example of a custom build that changes the `dist` folder of library compilations and sets up a `flow` command for type checking:

```js
// @flow
/*::
type TemplateArgs = {
  name: string,
  path: string,
  label: string,
  dependencies: Array<string>,
}
type Template = (TemplateArgs) => Promise<string>;
*/
const template /*: Template */ = async ({name, path, dependencies}) => `
package(default_visibility = ["//visibility:public"])

load("@jazelle//:build-rules.bzl", "web_library", "web_binary", "web_executable", "web_test", "flow_test")

web_library(
    name = "library",
    deps = [
        "//third_party/jazelle:node_modules",
        ${dependencies.map(d => `"${d}",`).join('\n        ')}
    ],
    srcs = glob(["**/*"], exclude = ["dist/**"]),
)

web_binary(
    name = "${name}",
    build = "build",
    command = "start",
    deps = [
        "//${path}:library",
    ],
    dist = ["dist"],
)

web_executable(
    name = "dev",
    command = "dev",
    deps = [
        "//${path}:library",
    ],
)

web_test(
    name = "test",
    command = "test",
    deps = [
        "//${path}:library",
    ],
)

web_test(
    name = "lint",
    command = "lint",
    deps = [
        "//${path}:library",
    ],
)

flow_test(
    name = "flow",
    deps = [
        "//${path}:library",
    ],
)`;

module.exports = {template};
```

Note that BUILD.bazel files are not regenerated once they have been created. You can edit them after they've been created if you need to name certain targets differently in specific projects, or if you need to add custom Bazel rules or non-JS Bazel dependencies.

Jazelle edits web_library rules when `jazelle add` and `jazelle remove` commands are issued, in order to update the `deps` list. If you use different rules to build web projects, you must keep the BUILD.bazel file in sync with your package.json file yourself.

---

## Bazel rules

- [Importing rules](#importing-rules)
- [Workspace rules](#workspace-rules)
  - [`jazelle_dependencies`](#jazelle_dependencies-rule)
- [Build rules](#build-rules)
  - [`jazelle`](#jazelle-rule)
  - [`web_library`](#web_library-rule)
  - [`web_binary`](#web_binary-rule)
  - [`web_executable`](#web_executable-rule)
  - [`web_test`](#web_test-rule)
  - [`flow_test`](#flow_test-rule)

The easiest to setup Bazel in an empty repository is to run `jazelle init`. If you are setting up Jazelle on an existing Bazel workspace, you need to manually add Jazelle rules to the root WORKSPACE and BUILD.bazel files.

### Importing rules

Before Jazelle rules can be used in Bazel, you must first import them:

```python
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-[version].tgz",
  sha256 = "SHA 256 goes here",
)
```

Jazelle SHA256 checksum can be computed through the following command:

```sh
curl -fLs https://registry.yarnpkg.com/jazelle/-/jazelle-[version].tgz | openssl sha256
```

### Workspace rules

Rules that should be used from a monorepo's WORKSPACE file.

```python
load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
```

#### `jazelle_dependencies` rule

Download and install binary dependencies (i.e. Node, Yarn) hermetically.

```python
jazelle_dependencies(
  node_version = string,
  node_sha256 = {
    "mac": string,
    "linux": string,
    "windows": string,
  },
  yarn_version = string,
  yarn_sha256 = string,
)
```

- `node_version` - The version of Node that should be installed
- `node_sha256` - The checksum of the architecture-specific distribution files of the chosen Node version
- `yarn_version` - The version of Yarn that should be installed
- `yarn_sha256` - The checksum of the chosen Yarn version

Jazelle SHA256 checksum can be computed through the following command:

```sh
curl -fLs https://github.com/lhorie/jazelle/releases/download/v[version]/jazelle-[version].tar.gz | openssl sha256
```

Node SHA256 checksums can be found at `https://nodejs.org/dist/v[version]/SHASUMS256.txt`. Use the checksums for these files:

- `node-v[version]-darwin-x64.tar.gz`
- `node-v[version]-linux-x64.tar.xz`
- `node-v[version]-win-x64.zip`

Yarn SHA256 checksum can be computed through the following command:

```sh
curl -fLs https://github.com/yarnpkg/yarn/releases/download/v[version]/yarn-[version].js | openssl sha256
```

### Build rules

Rules that should be used from a project's BUILD.bazel file.

`load("@jazelle//:build-rules.bzl", "web_library", "web_binary", "web_test")`

### `jazelle` rule

Run the [Jazelle CLI](#cli) from Bazel. This rule should be added to the root of the monorepo. Note that all arguments must be passed after `--`

`bazel run //:jazelle -- version`

```python
jazelle(name = "jazelle", manifest = "manifest.json")
```

- `name` - Should be `jazelle`
- `manifest` - Should be `manifest.json`

#### `web_library` rule

Describes a set of files as a library

```python
web_library(
  deps = [string],
  srcs = [string],
)
```

- `deps` - A list of target labels that are dependencies of this rule
- `srcs` - A list of source code files for the project

The `deps` argument in this rule is dynamically updated by Jazelle when you run `jazelle add` or `jazelle remove`. You should always declare project dependencies in this rule, rather than on the rules below.

This rule collects transitive files from the `DefaultInfo(files)` provider of targets specified by `deps` and outputs them as transitive files via the `DefaultInfo(files)` provider.

#### `web_binary` rule

Builds a project via an npm script and optionally runs it. If this rule is run via `bazel build`, it generates a `output.tgz` file representing the project's compiled assets. If this rule is run via `bazel run`, it additionally extracts the output file and runs the project using the NPM script specified by `command`. The build step is cacheable, while the run step is not.

```python
web_binary(
  build = string,
  command = string,
  deps = [string],
  dist = string
)
```

- `build` - The npm script to build the project. Defaults to `build`
- `command` - The npm script to run the project. Defaults to `start`
- `deps` - A list of target labels that are dependencies of this rule
- `dist` - The name of the output folder where compiled assets are saved to

This rule consumes transitive files from the `DefaultInfo(files)` provider of targets specified by `deps`. If the transitive files include `output.tgz` files, they are extracted into the root folder of their respective project (in the Bazel sandbox).

#### `web_executable` rule

Runs a npm script (e.g. `yarn start`). Meant to be used with `bazel run`

```python
web_test(
  command = string,
  deps = [string],
)
```

- `command` - The npm script to execute
- `deps` - A list of target labels that are dependencies of this rule

This rule consumes transitive files from the `DefaultInfo(files)` provider of targets specified by `deps`. If the transitive files include `output.tgz` files, they are extracted into the root folder of their respective project (in the Bazel sandbox).

#### `web_test` rule

Runs a npm script as a cacheable test (e.g. `yarn test`). Meant to be used with `bazel test`

```python
web_test(
  command = string,
  deps = [string],
)
```

- `command` - The npm script to execute
- `deps` - A list of target labels that are dependencies of this rule

This rule consumes transitive files from the `DefaultInfo(files)` provider of targets specified by `deps`. If the transitive files include `output.tgz` files, they are extracted into the root folder of their respective project (in the Bazel sandbox).

#### `flow_test` rule

Runs `yarn flow`

```python
flow_test(
  command = string,
  deps = [string],
)
```

- `deps` - A list of target labels that are dependencies of this rule

This rule consumes transitive files from the `DefaultInfo(files)` provider of targets specified by `deps`. If the transitive files include `output.tgz` files, they are extracted into the root folder of their respective project (in the Bazel sandbox).

---

## Yarn equivalents

Jazelle commands are similar to yarn commands, but **not** exactly equivalent. Here's a table showing similar commands and their differences.

| Jazelle           | Yarn             | Key differences                                                              |
| ----------------- | ---------------- | ---------------------------------------------------------------------------- |
| `jazelle install` | `yarn install`   | The Jazelle command also sets up local dependencies                          |
| `jazelle build`   | `yarn run build` | The Jazelle command also builds (and caches) local dependencies              |
| `jazelle test`    | `yarn run test`  | The Jazelle command caches tests for projects whose code didn't change       |
| `jazelle add x`   | `yarn add x`     | The Jazelle command also manages deps declared in BUILD.bazel files          |

You should always use Jazelle commands instead of Yarn commands.

---

## Bazel equivalents

Jazelle allows using Bazel directly for building targets. Here's a table showing equivalent commands:

| Jazelle                    | Bazel                 |
| -------------------------- | --------------------- |
| `cd a && jazelle install`  | N/A                   |
| `cd a && jazelle add x`    | N/A                   |
| `cd a && jazelle build`    | `bazel build //a:a`   |
| `cd a && jazelle start`    | `bazel run //a:a`     |
| `cd a && jazelle dev`      | `bazel run //a:dev`   |
| `cd a && jazelle test`     | `bazel test //a:test` |
| `cd a && jazelle lint`     | `bazel run //a:lint`  |
| `cd a && jazelle flow`     | `bazel run //a:flow`  |

You can use either Jazelle commands or Bazel commands interchangeably. This is helpful if your team is already invested into a Bazel-centric workflow.

It's recommended that you use Jazelle commands instead of Bazel, because Jazelle uses [Bazelisk](https://github.com/bazelbuild/bazelisk/) to enforce a Bazel version. You could also use Bazelisk itself.

## Monorepo-wide static analysis

If you are a monorepo maintainer and you need to implement static analysis logic that runs against files of every project in a monorepo, it's not feasible to depend on all projects at build time, since the build graph could conceivably require rebuilding every project in the monorepo. Instead, you can depend only on specific files.

The simplest way to do that is to add [`exports_files()`](https://docs.bazel.build/versions/master/be/functions.html#exports_files) or [`filegroup()`](https://docs.bazel.build/versions/master/be/general.html#filegroup) declarations in `buildFileTemplate` to expose the desired files. This way you can put your logic in a package that depends on files from several projects:

```python
# BUILD.bazel file in analyzable projects
exports_files([
  "//my-project:package.json", # expose the file we need for static analysis
])

# BUILD.bazel in static analysis project
js_binary(
  name = "check"
  command = "check",
  deps = [
    "//my-project:package.json",
    "//my-other-project:package.json",
    # ...
  ]
)
```

You can dynamically update the `deps` argument of the static analysis project BUILD.bazel file by writing a [`preinstall`](#installation-hooks) script that parses and edits the BUILD.bazel file. The list of monorepo projects is conveniently available in `manifest.json`.

Note that updating `buildFileTemplate` does not change existing BUILD.bazel files (since they could contain custom rules and modifications). If you want the same changes in existing files, you will have to edit those files yourself.

---

## TODOS

- add cli test args support to sandbox mode
- add command to import projects (add them to manifest.json)
- add command to detect non-imported projects
- detect WORKSPACE changes in `jazelle changes`
- watch library -> service
- hermetic install / refresh roots
