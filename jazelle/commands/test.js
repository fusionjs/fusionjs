// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
export type TestArgs = {
  root: string,
  cwd: string,
}
export type Test = (TestArgs) => Promise<void>
*/
const test /*: Test */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    await bazel.test({root, cwd});
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    await yarn.test({root, deps});
  }
};

module.exports = {test};
