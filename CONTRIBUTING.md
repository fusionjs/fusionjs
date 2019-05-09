foo

# Contributing to fusionjs

**Before continuing, make sure you've read the Rush [Getting Started as a Developer](https://rushjs.io/pages/developer/new_developer/) guide**.

This repo is maintained using [rushjs](https://rushjs.io). This doc will detail the commands needed to perform various tasks, but it's also helpful to read through the Rush [command docs](https://rushjs.io/pages/commands/rush_add/) as well.

---

### Table of contents

- [Dependencies](#dependencies)
  - [Install](#install)
  - [Add new](#add-new)
  - [Upgrade](#upgrade)
  - [node_modules/yarn.lock](#node_modulesyarnlock)
- [Workflow](#workflow)

---


## Dependencies

**NOTE**: Rush uses its own binary for yarn (version specified in `rush.json` > `yarnVersion`), so the only version you should need to worry about is node (configured in `rush.json` > `nodeSupportedVersionRange`)

### Install

Equivalent: `yarn install`

See: [rush install](https://rushjs.io/pages/commands/rush_install/), [rush build](https://rushjs.io/pages/commands/rush_build/)

```sh
rush install && rush build
```

### Add new

Equivalent: `yarn add lodash`

See: [rush add](https://rushjs.io/pages/commands/rush_add/)

```sh
# --caret: prepend with ^
# -m: update other packages with this dep
rush add --caret -m -p lodash
```

### Upgrade

Equivalent: `yarn upgrade`

See: [rush update](https://rushjs.io/pages/commands/rush_update/)

```sh
rush update
```

### node_modules/yarn.lock

Instead of `yarn.lock` being in the repository root or in individual packages, there now is a single, Rush-managed lockfile at `common/config/rush/yarn.lock`; and similarly, `common/temp/node_modules` is where all dependencies are installed and symlinked from in each package.


## Workflow

For linting, testing, and type checking individual packages, there isn't much of a difference. Each package still has its own `flow`, `lint` and `test` scripts, so running `yarn test`, for example, still works as expected.
