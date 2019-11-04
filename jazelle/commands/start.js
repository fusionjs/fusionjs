// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getPassThroughArgs} = require('../utils/parse-argv.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type StartArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
}
export type Start = (StartArgs) => Promise<void>
*/
const start /*: Start */ = async ({root, cwd, args}) => {
  await assertProjectDir({dir: cwd});

  const params = getPassThroughArgs(args);
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.start({root, cwd, args: params});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.start({root, deps, args: params});
  }
};

module.exports = {start};
