// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {
  reportMismatchedTopLevelDeps,
  getErrorMessage,
} = require('../utils/report-mismatched-top-level-deps.js');
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {generateBazelignore} = require('../utils/generate-bazelignore.js');
const {
  generateBazelBuildRules,
} = require('../utils/generate-bazel-build-rules.js');
const {downloadDeps} = require('../utils/download-deps.js');
const {installDeps} = require('../utils/install-deps.js');

/*::
export type InstallArgs = {
  root: string,
  cwd: string,
}
export type Install = (InstallArgs) => Promise<void>
*/
const install /*: Install */ = async ({root, cwd}) => {
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

  await generateDepLockfiles({deps});
  await generateBazelignore({root, projects: projects});
  await generateBazelBuildRules({root, deps, projects});
  await downloadDeps({root, deps});
  await installDeps({root, deps, hooks});
};

module.exports = {install};
