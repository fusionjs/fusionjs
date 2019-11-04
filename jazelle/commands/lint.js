// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getPassThroughArgs} = require('../utils/parse-argv.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type LintArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
}
export type Lint = (LintArgs) => Promise<void>
*/
const lint /*: Lint */ = async ({root, cwd, args}) => {
  await assertProjectDir({dir: cwd});

  const params = getPassThroughArgs(args);
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.lint({root, cwd, args: params});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.lint({root, deps, args: params});
  }
};

module.exports = {lint};
