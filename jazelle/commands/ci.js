// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {
  reportMismatchedTopLevelDeps,
  getErrorMessage,
} = require('../utils/report-mismatched-top-level-deps.js');
const {installDeps} = require('../utils/install-deps.js');

/*::
export type CiArgs = {
  root: string,
  cwd: string,
}
export type Ci = (CiArgs) => Promise<void>
*/
const ci /*: Ci */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  const {projects, versionPolicy, hooks} = await getManifest({root});
  const deps = await getLocalDependencies({
    dirs: projects.map(dir => `${root}/${dir}`),
    target: resolve(root, cwd),
  });

  const result = await reportMismatchedTopLevelDeps({
    root,
    projects,
    versionPolicy,
  });
  if (!result.valid) throw new Error(getErrorMessage(result));

  await installDeps({root, deps, hooks});
};

module.exports = {ci};
