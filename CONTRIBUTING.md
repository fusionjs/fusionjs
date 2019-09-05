# Contributing to Fusion.js

**Before continuing, please familiarize yourself with [Jazelle](https://github.com/fusionjs/fusionjs/tree/master/jazelle) and ensure the correct version is installed on your system (check the version outlined in `WORKSPACE`)**.

This repo is maintained using [Jazelle](https://github.com/fusionjs/fusionjs/tree/master/jazelle). This doc will detail the commands needed to perform various tasks, but it's also helpful to read through the Jazelle [README.md](https://github.com/fusionjs/fusionjs/blob/master/jazelle/README.md) as well.

---

### Table of contents

- [Dependencies](#dependencies)
  - [Install](#install)
  - [Add new](#add-new)
  - [Upgrade](#upgrade)
  - [yarn.lock](#yarnlock)
- [Workflow](#workflow)
- [Landing changes](#landing-changes)

---


## Dependencies

**NOTE**: Jazelle uses its own binaries for yarn and node (versions specified in `WORKSPACE`) but to ensure compatibility you should use the same version system wide.

### Install

Equivalent: `yarn install`

See: [jazelle install](https://github.com/fusionjs/fusionjs/blob/master/jazelle/README.md#jazelle-install), [jazelle build](https://github.com/fusionjs/fusionjs/blob/master/jazelle/README.md#jazelle-build)

```sh
jazelle install && jazelle build
```

### Add new

Equivalent: `yarn add react@16.8.2`

See: [jazelle add](https://github.com/fusionjs/fusionjs/blob/master/jazelle/README.md#jazelle-add).

```sh
jazelle add react@16.8.2
```

### Upgrade

Equivalent: `yarn upgrade`

See: [jazelle upgrade](https://github.com/fusionjs/fusionjs/blob/master/jazelle/README.md#jazelle-upgrade)

```sh
jazelle upgrade --name react
```

### yarn.lock

Each package manages its own `yarn.lock` file. Make sure to commit any changes made into the repository.

## Workflow

For linting, testing, and type checking individual packages, use the equivalent jazelle commands e.g. `jazelle flow`, `jazelle lint`, and `jazelle test`.

## Landing changes

If you're a member of the `fusionjs` org, or have write permissions to this repo, you can comment `!import` on a pull request, which will import the change to our parent monorepo for final review.
