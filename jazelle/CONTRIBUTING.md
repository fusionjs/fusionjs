# CONTRIBUTING

If you are contributing code to the Jazelle codebase, reading this document may help you get familiarized with the code structure and various core concepts.

- [Code structure](#code-structure)
- [Bazel crash course](#bazel)
  - [Implementing custom rules](#implementing-custom-rules)
  - [Familiarizing with Starlark API](#familiarizing-with-starlark-api)
- [Virtual dependency management](#virtual-dependency-management)
- [How to work with Jazelle's codebase](#how-to-work-with-jazelles-codebase)

## Code structure

```yaml
- bin/
  - cli.sh # CLI entry point
- commands/ # JS files for CLI commands
- rules/ # Bazel rules and helper files
- templates/ # Templates for code generation
- tests/
  - index.js # All tests live here
  - fixtures/ # Fixtures are typically copied to a `tests/tmp` folder when being used for tests
- utils/ # Most JS logic lives here
- cli.js # JS entry point for CLI (called from bin/cli.sh)
- index.js # JS entry point for programmatic API
- workspace-rules.bzl # entry point for Bazel workspace rules
- build-rules.bzl # entry point for Bazel build rules
```

## Bazel crash course

[Bazel](https://bazel.build) (pronounced "basil") is a build system that lets projects' build step depend on the compiled assets of other projects, caching builds if possible.

A Bazel rule will typically look something like this:

```python
# ./my-project/BUILD.bazel
foo_library(
  name = "hi",
  deps = [
    "//my-other-project:hello",
  ],
  srcs = glob(["**/*"]),
)
```

This indicates that there's a buildable project in the folder `./my-project`, and that it depends on another project that lives in the folder `./my-other-project`.

To build this project with the Bazel CLI, you need to target its label: `bazel build //my-project:hi`.

A Bazel target label is comprised of:

- An optional namespace (e.g. `@jazelle`), useful for referencing targets in different Bazel workspaces (e.g. from different monorepos)
- Double slash (`//`)
- A path to a BUILD.bazel file (e.g. `my-project` in the example above)
- A colon (`:`)
- A target name (e.g. `hi` in the example above)

### Implementing custom rules

A Bazel rule describes how something is supposed to be built. It typically has an implementation, it can receive arguments from a rule consumer through attributes, and it can provide transitive files to other rules that depend on them.

Bazel uses a language called Starlark to implement rules. Starlark is syntactically a subset of Python. The API can be found at [https://docs.bazel.build/versions/master/skylark/lib/skylark-overview.html](https://docs.bazel.build/versions/master/skylark/lib/skylark-overview.html).

There are two major types of rules in Bazel:

A `repository_rule` is meant for downloading assets from the internet. It can write `BUILD.bazel` files in dynamically generated namespaces. This is used to dynamically generate the `@jazelle_dependencies` namespace, which contains the Node and Yarn binaries. Repository rules are always called from `WORKSPACE` files.

A regular `rule` is meant for everything else. Regular rules are always called from `BUILD.bazel` files.

In addition, a `rule` can run shell scripts in two different phases. Shell scripts passed to `ctx.actions.run_shell()` calls run at build time, in topologically sorted order of dependencies. Shell scripts passed to `ctx.actions.write()` calls run at run time. Build-time scripts are run within a locked down sandbox environment, and cached as long as none of their inputs change. Runtime scripts are run with user permissions. They are cached if they are run as tests, but they are not cached if they are run with `bazel run`.

Bazel requires all inputs and outputs to be explicitly defined (either by the rule implementor or by the rule consumer). Jazelle was designed to be agnostic of Javascript bundlers, but this comes at a cost: it outputs a single .tgz file containing all files in a output folder and it untars these files in each transitive step, as well as at runtime. Because of this, build outputs with large files may slow down builds and should be made as small as possible.

Rules can pass transitive files to other rules by returning a `DefaultInfo(files)` provider from a rule's `implementation` function. Other rules can then extract files from those providers and pass them to their own shell scripts. See the `web_library` rule in `rules/web-monorepo.bzl` for an example.

Files are represented in Bazel using label syntax (e.g. the file `./my-project/index.js` is represented via the label `//my-project:index.js`). Projects must be made visible to other projects if they are used as direct dependencies. Visibility is commonly controlled via the `package(default_visibility = ["//visibility:public"])` directive in a project's BUILD.bazel file.

Note that Bazel executes shell scripts lazily, i.e. if it's not required to build a target, it will not run. This also applies to `repository_rule` downloads.

### Familiarizing with Starlark API

The most important APIs to familiarize yourself with are [`ctx`](https://docs.bazel.build/versions/master/skylark/lib/ctx.html) and [`ctx.actions`](https://docs.bazel.build/versions/master/skylark/lib/actions.html). The `ctx` object is passed as the argument to a [`rule`](https://docs.bazel.build/versions/0.25.0/skylark/lib/globals.html#rule) implementation function.

```python
# Rules are defined in .bzl files like so:
# foo.bzl

def _foo_impl(ctx):
  print("Hello world")

# assigning to a global variable makes the rule public
foo = rule(
  implementation = _foo_impl,
  attrs = {
    # `srcs` is an attribute (think of it as a named argument when we call `foo()` from a BUILD.bazel file)
    "srcs": attr.label_list(
      allow_files = True,
    ),
  },
)

# BUILD.bazel files let project owners configure how a project is built
load("//:foo.bzl", "foo") # import `foo` from foo.bzl

foo(
  name = "greet"
  srcs = ["hello.txt"], # here we can specify arguments
)
```

Calling `foo` above declares a target whose name is `greet`. It can now be targeted by the `bazel build` CLI command:

```sh
bazel build //:greet
```

Typically, instead of calling `print("Hello world")`, a rule will call `ctx.actions.run_shell()` to compile code within a sandbox or `ctx.actions.write` to generate a runtime shell script that can be run via `bazel run`.

Bazel requires that you specify what files are used by any given shell script. For `run_shell`, you pass the files via the `inputs` argument. Similarly, you must specify the output file(s) via the `outputs` argument. See `_web_library_impl` in `rules/web-monorepo.bzl` for an example.

To specify input files for runtime scripts, you must return `[DefaultInfo(runfiles)]` from the implementation function. See `_web_binary_impl` in `rules/web-monorepo.bzl` for an example.

To inspect the Bazel output folder, run `ls -L $(bazel info output_path)`. Note that the compilation sandbox cannot be inspected this way since it's deleted after each compilation. You can debug its contents via `ls -L` commands from the shell scripts that you pass to Bazel's API calls.

## Virtual dependency management

Jazelle dynamically computes a graph of dependencies for the project based on the project folder from which CLI commands are issued. Then it synchronizes all of their yarn.lock files so that there are no duplicated transitive dependencies. A global lockfile is generated and Jazelle uses it to assemble node_modules folders for all the relevant projects in the graph of dependencies.

Jazelle caches network requests for dependency downloads. This means that issuing CLI commands from many different projects won't re-download the same assets redundantly.

Jazelle also updates BUILD.bazel files after `jazelle add`, `jazelle remove`, `jazelle upgrade` and `jazell install` commands if the list of dependencies in a project changes.

## How to work with Jazelle's codebase

### Fixing bugs

If you are fixing bugs, you can run `yarn test [theTestYouWant]` to selectively run only the test you care about. For example, `yarn test testInstallAddUpgradeRemove` only runs the `testInstallAddUpgradeRemove` test.

If you're adding tests, prefer to add tests in the `Promise.all` of `runTests` in `tests/index.js`. Using the `t(testFoo)` call instead of a plain `testFoo()` call ensures the test can be run in isolation, as described above.

### Using bleeding-edge Jazelle for troubleshooting in a monorepo

Clone the fusionjs repo as a sibling folder to your monorepo:

```
# development folder structure
- my-projects
  - fusionjs/jazelle
  - my-monorepo
```

Open `my-monorepo/WORKSPACE` file and change the jazelle `http_archive` declaration to a `local_repository` declaration:

```python
# BEFORE
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-[version].tgz",
  sha256 = "SHA 256 goes here",
  strip_prefix = "package",
  patch_cmds = ["npm install"],
)

# AFTER
local_repository(
    name = "jazelle",
    path = "../fusionjs/jazelle",
)
```

This tells Bazel to use the Bazel files in your cloned repo instead of pulling them from the package registry.

Verify that you can run commands from your development workspace:

```sh
cd my-monorepo
../jazelle/bin/cli.sh version
```

Now you can run `../fusionjs/jazelle/bin/cli.sh [command]` to run Jazelle commands from your development workspace.
