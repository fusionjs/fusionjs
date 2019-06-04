const {resolve} = require('path');
const {getRootDir} = require('./utils/get-root-dir.js');
const {parse} = require('./utils/parse-argv.js');
const {cli} = require('./utils/cli.js');
const {install} = require('./commands/install.js');
const {add} = require('./commands/add.js');
const {remove} = require('./commands/remove.js');
const {upgrade} = require('./commands/upgrade.js');
const {greenkeep} = require('./commands/greenkeep.js');
const {dedupe} = require('./commands/dedupe.js');
const {purge} = require('./commands/purge.js');
const {check} = require('./commands/check.js');
const {chunk} = require('./commands/chunk.js');
const {changes} = require('./commands/changes.js');
const {build, test, run} = require('./utils/bazel.js');
const {reportMismatchedTopLevelDeps} = require('./utils/report-mismatched-top-level-deps.js');
const {getChunkPattern} = require('./utils/get-chunk-pattern.js');
const {findChangedTargets} = require('./utils/find-changed-targets.js');
const {scaffold} = require('./utils/scaffold.js');
const {version} = require('./package.json');

async function runCLI([command, ...rest]) {
  const root = command === 'init' || command === 'version' || command === '--help'
    ? process.cwd()
    : await getRootDir({dir: process.cwd()});
  const args = parse(rest);
  args.cwd = args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd();

  await cli(command, args, {
    version: [
      `Display the version number`,
      () => console.log(version),
    ],
    init: [
      `Scaffolds a workspace`,
      () => scaffold({cwd: process.cwd()}), // actually runs from bin/cli.sh because it needs to generate Bazel files
    ],
    install: [
      `Install all dependencies for a project

      --cwd [cwd]             Project directory to use`,
      ({cwd}) => install({root, cwd}),
    ],
    add: [
      `Installs a package and any packages that it depends on

      [name]                  Package to add
      --version [version]     Version
      --dev                   Whether to install as devDependency
      --cwd [cwd]             Project directory to use`,
      ({cwd, name, version, dev}) => add({root, cwd, name, version, dev}),
    ],
    remove: [
      `Remove a package

      [name]                  Package to remove
      --cwd [cwd]             Project directory to use`,
      ({cwd, name}) => remove({root, cwd, name}),
    ],
    upgrade: [
      `Upgrade a package version

      [name]                  Package to add
      --version [version]     Version
      --cwd [cwd]             Project directory to use`,
      ({cwd, name, version}) => upgrade({root, cwd, name, version}),
    ],
    greenkeep: [
      `Upgrade a package version across all projects

      [name]                  Package to add
      --version [version]     Version`,
      ({name, version}) => greenkeep({root, name, version}),
    ],
    dedupe: [
      `Dedupe transitive deps across all projects`,
      () => dedupe({root}),
    ],
    purge: [
      `Removes generated files (i.e. node_modules folders and bazel output files)`,
      () => purge({root}),
    ],
    check: [
      `Display deps w/ multiple versions installed across projects`,
      () => check({root}),
    ],
    chunk: [
      `Print a glob pattern representing a chunk of a set of files

      --patterns [patterns]   Glob patterns, separated by |
      --jobs [count]          Total number of chunks to divide files into
      --index [index]         Which chunk to display`,
      ({patterns, jobs, index}) => chunk({root, patterns, jobs, index}),
    ],
    changes: [
      `Lists Bazel test targets that changed since the last git commit`,
      () => changes({root}),
    ],
    build: [
      `Build a project. Equivalent to \`bazel build\`

      [name]                  Bazel action name. Optional
      --cwd [cwd]             Project directory to use`,
      ({cwd, name}) => build({root, cwd, name}),
    ],
    run: [
      `Run a project. Equivalent to \`bazel run\`

      [name]                  Bazel action name
      --cwd [cwd]             Project directory to use`,
      ({cwd, name}) => run({root, cwd, name}),
    ],
    test: [
      `Test a project. Equivalent to \`bazel test\`

      [name]                  Bazel action name. Optional
      --cwd [cwd]             Project directory to use`,
      ({cwd, name}) => test({root, cwd, name}),
    ],
  }, rest);
}

module.exports = {
  runCLI,
  version,
  scaffold,
  install,
  add,
  remove,
  upgrade,
  greenkeep,
  dedupe,
  purge,
  check: reportMismatchedTopLevelDeps,
  chunk: getChunkPattern,
  changes: findChangedTargets,
  build,
  test,
  run,
  getRootDir,
};