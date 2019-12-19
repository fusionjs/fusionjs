// @flow
const {resolve} = require('path');
const {getRootDir} = require('./utils/get-root-dir.js');
const {parse} = require('./utils/parse-argv.js');
const {cli} = require('./utils/cli.js');
const {version} = require('./commands/version.js');
const {install} = require('./commands/install.js');
const {ci} = require('./commands/ci.js');
const {add} = require('./commands/add.js');
const {remove} = require('./commands/remove.js');
const {upgrade} = require('./commands/upgrade.js');
const {dedupe} = require('./commands/dedupe.js');
const {purge} = require('./commands/purge.js');
const {check} = require('./commands/check.js');
const {chunk} = require('./commands/chunk.js');
const {changes} = require('./commands/changes.js');
const {plan} = require('./commands/plan.js');
const {batch} = require('./commands/batch.js');
const {build} = require('./commands/build.js');
const {dev} = require('./commands/dev.js');
const {test} = require('./commands/test.js');
const {lint} = require('./commands/lint.js');
const {flow} = require('./commands/flow.js');
const {start} = require('./commands/start.js');
const {node} = require('./commands/node.js');
const {yarn} = require('./commands/yarn.js');
const {exec} = require('./commands/exec.js');
const {each} = require('./commands/each.js');
const {bazel} = require('./commands/bazel.js');
const {bump} = require('./commands/bump.js');
const {doctor} = require('./commands/doctor.js');
const {
  reportMismatchedTopLevelDeps,
} = require('./utils/report-mismatched-top-level-deps.js');
const {getChunkPattern} = require('./utils/get-chunk-pattern.js');
const {findChangedTargets} = require('./utils/find-changed-targets.js');
const {getTestGroups} = require('./utils/get-test-groups.js');
const {scaffold} = require('./utils/scaffold.js');

/*::
export type RunCLI = (Array<string>) => Promise<void>;
*/
const runCLI /*: RunCLI */ = async argv => {
  const [command, ...rest] = argv;
  const args = parse(rest);
  args.cwd = args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd();
  await cli(
    command,
    args,
    {
      version: [`Display the version number`, version],
      init: [
        `Scaffolds a workspace`,
        async () => scaffold({cwd: process.cwd()}), // actually runs from bin/cli.sh because it needs to generate Bazel files
      ],
      setup: [
        `Installs Jazelle hermetically`, // installation happens in bin/cli.sh, nothing to do here
        async () => {},
      ],
      install: [
        `Install all dependencies for a project, modifying lockfiles and Bazel BUILD files if necessary

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => install({root: await rootOf(args), cwd}),
      ],
      ci: [
        `Install all dependencies for a project without modifying source files

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => ci({root: await rootOf(args), cwd}),
      ],
      add: [
        `Install a package and any packages that it depends on

        [name]                     Package to add at a specific version. ie., foo@1.2.3
        --dev                      Whether to install as devDependency
        --cwd [cwd]                Project directory to use`,
        async ({cwd, name, dev}) =>
          add({
            root: await rootOf(args),
            cwd,
            name: name || dev, // if dev is passed before name, resolve to correct value
            dev: Boolean(dev), // FIXME all args can technically be boolean, but we don't want Flow complaining about it everywhere
          }),
      ],
      remove: [
        `Remove a package

        [name]                     Package to remove
        --cwd [cwd]                Project directory to use`,
        async ({cwd, name}) => remove({root: await rootOf(args), cwd, name}),
      ],
      upgrade: [
        `Upgrade a package version across all projects

        [name]                     Package to upgrade at a specific version. ie., foo@1.2.3
        --version [version]        Version
        --from [from]              If current version satisfies this semver range. Optional`,
        async ({name, version, from}) =>
          upgrade({root: await rootOf(args), name, version, from}),
      ],
      dedupe: [
        `Dedupe transitive deps across all projects`,
        async () => dedupe({root: await rootOf(args)}),
      ],
      purge: [
        `Remove generated files (i.e. node_modules folders and bazel output files)`,
        async () => purge({root: await rootOf(args)}),
      ],
      check: [
        `Display deps w/ multiple versions installed across projects

        --json                     Whether to print as JSON (e.g. for piping to jq)`,
        async ({json}) =>
          check({root: await rootOf(args), json: Boolean(json)}),
      ],
      chunk: [
        `Print a glob pattern representing a chunk of a set of files

        --patterns [patterns]      Glob patterns, separated by |
        --jobs [count]             Total number of chunks to divide files into
        --index [index]            Which chunk to display`,
        async ({patterns, jobs, index}) =>
          chunk({root: await rootOf(args), patterns, jobs, index}),
      ],
      changes: [
        `Lists Bazel test targets that changed given a list of changed files

        [files]                    A file containing a list of changed files (one per line). Defaults to stdin
        --type [type]              'bazel' or 'dirs'. Defaults to 'bazel'`,
        async ({name, type}) =>
          changes({root: await rootOf(args), files: name, type}),
      ],
      plan: [
        `Outputs a plan that can be passed to \`jazelle batch\` for parallelizing a group of tests across workers

        [targets]                  A file containing a list of targets (typically from \`jazelle changes\`). Defaults to stdin
        --nodes [nodes]            The number of nodes (i.e. cloud machines). Defaults to 1`,
        async ({name, workers, nodes}) =>
          plan({root: await rootOf(args), targets: name, workers, nodes}),
      ],
      batch: [
        `Runs a plan from \`jazelle plan\`, parallelizing tests across workers

        [plan]                     A file containing a plan (typically from \`jazelle plan\`). Defaults to stdin
        --index                    Which group of tests to execute. Defaults to 0
        --cores [cores]            Number of CPUs to use. Defaults to \`os.cpus().length\``,
        async ({name, index, cores}) =>
          batch({root: await rootOf(args), plan: name, index, cores}),
      ],
      build: [
        `Build a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => build({root: await rootOf(args), cwd}),
      ],
      dev: [
        `Run a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => dev({root: await rootOf(args), cwd, args: rest}),
      ],
      test: [
        `Test a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => test({root: await rootOf(args), cwd, args: rest}),
      ],
      lint: [
        `Lint a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => lint({root: await rootOf(args), cwd, args: rest}),
      ],
      flow: [
        `Typecheck a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => flow({root: await rootOf(args), cwd, args: rest}),
      ],
      start: [
        `Run a project

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => start({root: await rootOf(args), cwd, args: rest}),
      ],
      bazel: [
        `Run a Bazel command

        [args...]                  A space separated list of arguments`,
        async ({cwd}) => bazel({root: await rootOf(args), args: rest}),
      ],
      node: [
        `Runs Node

        [args...]                  A space separated list of arguments
        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => node({cwd, args: rest}),
      ],
      yarn: [
        `Runs a Yarn command

        [name]                     A yarn command name
        [args...]                  A space separated list of arguments
        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => yarn({cwd, args: rest}),
      ],
      exec: [
        `Runs a bash script

        [args...]                  A space separated list of arguments
        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => exec({root: await rootOf(args), cwd, args: rest}),
      ],
      each: [
        `Runs a script in each project

        [args...]                  A space separated list of arguments`,
        async ({cwd}) => each({root: await rootOf(args), cwd, args: rest}),
      ],
      bump: [
        `Bump version for the specified package, plus changed dependencies

        [type]                     major, premajor, minor, preminor, patch, prepatch, prerelease or none
        --frozenPackageJson        If true, throws if changes to package.json are required
        --cwd [cwd]                Project directory to use`,
        async ({cwd, name: type, frozenPackageJson: frozen}) =>
          bump({
            root: await rootOf(args),
            cwd,
            type: type || frozen, // if frozen is passed before type, resolve to correct value
            frozenPackageJson: Boolean(frozen),
          }),
      ],
      doctor: [
        `Provides advice for some types of issues

        --cwd [cwd]                Project directory to use`,
        async ({cwd}) => doctor({root: await rootOf(args), cwd}),
      ],
    },
    async () => {}
  );
};

async function rootOf(args) {
  return getRootDir({dir: args.cwd});
}

module.exports = {
  runCLI,
  version: require('./package.json').version,
  scaffold,
  install,
  ci,
  add,
  remove,
  upgrade,
  dedupe,
  purge,
  check: reportMismatchedTopLevelDeps,
  chunk: getChunkPattern,
  changes: findChangedTargets,
  plan: getTestGroups,
  batch,
  build,
  dev,
  test,
  lint,
  flow,
  start,
  bazel,
  node,
  yarn,
  bump,
  doctor,
  getRootDir,
};
