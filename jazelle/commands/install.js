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

/*::
export type InstallArgs = {
  root: string,
  cwd: string,
  frozenLockfile?: boolean,
  conservative?: boolean,
}
export type Install = (InstallArgs) => Promise<void>
*/
const install /*: Install */ = async ({
  root,
  cwd,
  frozenLockfile = false,
  conservative = true,
}) => {
  await assertProjectDir({dir: cwd});

  const {
    projects,
    versionPolicy,
    hooks,
    workspace,
    dependencySyncRule,
  } = /*:: await */ await getManifest({root});

  validateRegistration({root, cwd, projects});

  const deps = /*:: await */ await getLocalDependencies({
    dirs: projects.map(dir => `${root}/${dir}`),
    target: resolve(root, cwd),
  });

  validateDeps({deps});
  await validateVersionPolicy({root, projects, versionPolicy});

  const all = await getAllDependencies({root, projects});
  await generateDepLockfiles({
    root,
    deps: all,
    ignore: all,
    frozenLockfile,
    conservative,
  });
  if (workspace === 'sandbox' && frozenLockfile === false) {
    await generateBazelignore({root, projects: projects});
    await generateBazelBuildRules({root, deps, projects, dependencySyncRule});
  }
  await installDeps({root, cwd, deps, ignore: all, hooks});
};

const validateRegistration = ({root, cwd, projects}) => {
  if (!projects.find(dir => resolve(`${root}/${dir}`) === cwd)) {
    const registrationError = `The package at ${cwd} should be registered in the projects field in manifest.json.`;
    throw new Error(registrationError);
  }
};

const validateDeps = ({deps}) => {
  // ensure packages have names
  const nameless = deps.find(dep => !dep.meta.name);
  if (nameless) {
    throw new Error(`${nameless.dir}/package.json is missing a name field`);
  }

  // ensure package names are not duplicated
  const names = {};
  for (const dep of deps) {
    if (names[dep.meta.name]) {
      const dupeDir = names[dep.meta.name];
      const error = `Duplicate project name in ${dep.dir} and ${dupeDir}`;
      throw new Error(error);
    }
    names[dep.meta.name] = dep.dir;
  }

  // ensure there's no cyclical deps
  const cycles = detectCyclicDeps({deps});
  if (cycles.length > 0) {
    const cycleError =
      'Cyclic local dependencies detected. Run `jazelle doctor` for more info';
    throw new Error(cycleError);
  }
};

const validateVersionPolicy = async ({root, projects, versionPolicy}) => {
  const result = await reportMismatchedTopLevelDeps({
    root,
    projects,
    versionPolicy,
  });
  if (!result.valid) throw new Error(getErrorMessage(result, false));
};

module.exports = {install};
