// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {
  reportMismatchedTopLevelDeps,
  getErrorMessage,
} = require('../utils/report-mismatched-top-level-deps.js');
const {detectCyclicDeps} = require('../utils/detect-cyclic-deps.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {generateBazelignore} = require('../utils/generate-bazelignore.js');
const {
  generateBazelBuildRules,
} = require('../utils/generate-bazel-build-rules.js');
const {installDeps} = require('../utils/install-deps.js');
const {getDownstreams} = require('../utils/get-downstreams.js');

/*::
export type InstallArgs = {
  root: string,
  cwd: string,
  frozenLockfile?: boolean
}
export type Install = (InstallArgs) => Promise<void>
*/
const install /*: Install */ = async ({root, cwd, frozenLockfile = false}) => {
  await assertProjectDir({dir: cwd});

  const {
    projects,
    versionPolicy,
    hooks,
    workspace,
  } = /*:: await */ await getManifest({root});
  const deps = /*:: await */ await getLocalDependencies({
    dirs: projects.map(dir => `${root}/${dir}`),
    target: resolve(root, cwd),
  });

  if (!projects.find(dir => `${root}/${dir}` === cwd)) {
    const registrationError = `The package at ${cwd} should be registered in the projects field in manifest.json.`;
    throw new Error(registrationError);
  }

  const result = await reportMismatchedTopLevelDeps({
    root,
    projects,
    versionPolicy,
  });
  if (!result.valid) throw new Error(getErrorMessage(result, false));

  const cycles = detectCyclicDeps({deps});
  if (cycles.length > 0) {
    const cycleError =
      'Cyclic local dependencies detected. Run `jazelle doctor` for more info';
    throw new Error(cycleError);
  }

  const all = await getAllDependencies({root, projects});
  const downstreams = [];
  for (const dep of deps) {
    downstreams.push(...getDownstreams(all, dep));
  }
  const map = {};
  for (const dep of [...deps, ...downstreams]) {
    map[dep.meta.name] = dep;
  }
  await generateDepLockfiles({
    root,
    deps: Object.keys(map).map(key => map[key]),
    ignore: all,
    frozenLockfile,
  });
  if (workspace === 'sandbox' && frozenLockfile === false) {
    await generateBazelignore({root, projects: projects});
    await generateBazelBuildRules({root, deps, projects});
  }
  await installDeps({root, cwd, deps, ignore: all, hooks});
};

module.exports = {install};
