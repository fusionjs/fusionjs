// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type StartArgs = {
  root: string,
  cwd: string,
}
export type Start = (StartArgs) => Promise<void>
*/
const start /*: Start */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.start({root, cwd});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.start({root, deps});
  }
};

module.exports = {start};
