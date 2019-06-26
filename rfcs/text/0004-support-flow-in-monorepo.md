* 2019-06-11
* RFC PR: (leave this empty)
* Fusion Issue: (leave this empty)

# Summary

This adds support for Flow within the broader Fusion.js monorepo.

The implications discussed here while important for this monorepo are broader in scope and may identify issues and solutions in other monorepos using Flow that are structured similar to the Fusion.js monorepo.  For example, we discuss how Rush works below but the issues discussed are likely to present in other monorepo structures due to the opinions on file structures baked into Flow.

# Motivation

This proposal is motivated by issues that arise due to the migration of Fusion.js-related repositories to a single "Fusion.js monorepo".  The monorepo includes many of the core packages (e.g. `fusion-core`, `fusion-cli`, `fusion-react`) as well as the many plugins owned by the Web Architecture Team at Uber (e.g. `fusion-plugin-universal-events`).

As of the writing of this RFC, the Fusion.js monorepo is maintained using Rush (see [CONTRIBUTING.md](ionjs/blob/master/CONTRIBUTING.md)).  If you are not familiar with Rush, I recommend reading through the [Rush documentation](https://rushjs.io/pages/intro/welcome/) before continuing.

# Background

## Rush

[`rush flow`](https://github.com/fusionjs/fusionjs/blob/master/common/config/rush/command-line.json#L29) currently runs as a "global" command, which essentially runs `flow check` at the root of the monorepo.  This is similar to how `yarn flow` runs `flow check` in the multi-repo setup for Fusion.js packages, but for only a single project.

## Flow

Flow supports a single [`.flowconfig`](https://flow.org/en/docs/config/) file.  This file serves two purposes.  Firstly, it is used to configure Flow for that specific project.  Secondly, it also defines the project root for Flow.  Because of this, it is [not intended to be used to construct a recursive configuration](https://github.com/facebook/flow/issues/238#issuecomment-72089643).  In other words, only the first ancestral `.flowconfig` file is used when running Flow.

Flow also supports [library definition](https://flow.org/en/docs/libdefs/) (libdef) files which, by default, exist in the `<PROJECT_ROOT>/flow-typed/` directory.  These define type information, generally at the module level, for third-party dependencies. 

# Problem

Not surprisingly, a monorepo may cause issues as each project defines its own `.flowconfig` file, many of which are not consistent across repositories.

For example, [`create-fusion-app`](https://github.com/fusionjs/fusionjs/blob/master/create-fusion-app/.flowconfig) defines a number of ignored directories:
```
[ignore]
.*/templates/.*
.*/test-artifacts/.*
```

Whereas [`fusion-tokens`](https://github.com/fusionjs/fusionjs/blob/master/fusion-tokens/.flowconfig) defines none.

Furthermore, Flow resolves libdef files in the `<PROJECT_ROOT>/flow-typed/` directory by default.  Given that each project has its own `flow-typed` directory, and no project is at the "root" anymore, Flow fails to resolve any of these when running the `rush flow` command.  Unfortunately, Flow will not complain about missing type information, instead opting to resolve all untyped imports to `any`.  This may cause type coverage regressions.

# Solution

Align on a single `.flowconfig` file to live in the root of the monorepo.  While one exists today, it importantly misses many of the library definition (libdef) files defined by individual projects' configurations.

We must ensure all relevant libdef files are included in the root configuration.  Any custom configuration in a single project must also be either supported across the entire monorepo, or removed.

If multiple projects require a libdef for the same dependency, we ideally house only a single source of truth for that type information.  In this way, the monorepo solution cuts down on duplicated code and ensures consistency across projects.

Individual projects will have the same `.flowconfig` file that points to monorepo libdef files.  This allows folks to continue to run `yarn flow` within a single project during development.

Furthermore, this new paradigm should be documented in order to help formalize the structure and ensure future changes are consistent (e.g. all new libdefs live in the same place).

##### Alternatives

Rush supports running non-global commands.  We could instead run Flow within each project via a ["bulk" command](https://rushjs.io/pages/maintainer/custom_commands/).  This would essentially mirror the multi-repo solution.
