// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type FlowArgs = {
  root: string,
  cwd: string,
}
export type Flow = (FlowArgs) => Promise<void>
*/
const flow /*: Flow */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.flow({root, cwd});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.flow({root, deps});
  }
};

module.exports = {flow};
