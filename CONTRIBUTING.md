# Contributing to Fusion.js

This repo is maintained using [Yarn v2](https://github.com/yarnpkg/berry). This doc will detail the commands needed to perform various tasks, but it's also helpful to read through the [Yarn v2 Documentation](https://yarnpkg.com/getting-started) as well.

At the very least, take a look at the [Quick start](#quick-start) section to help you get started on developing in the monorepo.

---

### Table of contents

- [Quick start](#quick-start)
- [Dependencies](#dependencies)
  - [Install](#install)
  - [Add new](#add-new)
  - [Upgrade](#upgrade)
  - [yarn.lock](#yarnlock)
- [Workflow](#workflow)
- [Landing changes](#landing-changes)

---


## Quick start

### 1. Install Yarn

See official [Yarn installation guide](https://yarnpkg.com/getting-started/install)

```sh
# Node.js <16.10
# npm i -g corepack

corepack enable
```

### 2. Take it for a spin

```sh
yarn install
cd some/package/path
```

To build current project, and all its dependencies:
```sh
yarn workspaces foreach -R run prepack
```

To build all projects:
```sh
yarn workspaces foreach -A run prepack
```

Then, run commands as usual:
```sh
yarn lint
yarn flow
yarn test
```


## Dependencies

#### yarn.lock

Yarn v2 manages dependencies with a top-level `yarn.lock` and `.yarn/cache` directory.

## Workflow

For linting, testing, and type checking individual packages, run the respective workspace commands e.g. `yarn flow`, `yarn lint`, and `yarn test`.

## Landing changes

If you're a member of the `fusionjs` org, or have write permissions to this repo, you can comment `!import` on a pull request, which will import the change to our parent monorepo for final review.
