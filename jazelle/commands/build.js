// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type BuildArgs = {
  root: string,
  cwd: string,
}
export type Build = (BuildArgs) => Promise<void>
*/
const build /*: Build */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.build({root, cwd});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.build({root, deps});
  }
};

module.exports = {build};
