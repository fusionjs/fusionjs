// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type DevArgs = {
  root: string,
  cwd: string,
}
export type Dev = (DevArgs) => Promise<void>
*/
const dev /*: Dev */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.dev({root, cwd});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.dev({root, deps});
  }
};

module.exports = {dev};
