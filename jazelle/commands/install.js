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
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {generateBazelignore} = require('../utils/generate-bazelignore.js');
const {
  generateBazelBuildRules,
} = require('../utils/generate-bazel-build-rules.js');
const {installDeps} = require('../utils/install-deps.js');
const {getDownstreams} = require('../utils/get-downstreams.js');
const {read} = require('../utils/node-helpers.js');

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
  if (!result.valid) throw new Error(getErrorMessage(result));

  const cycles = detectCyclicDeps({deps});
  if (cycles.length > 0) {
    throw new Error(
      'Cyclic local dependencies detected. Run `jazelle doctor` for more info'
    );
  }

  const downstreams = await findDownstreams({root, deps, projects});
  const map = {};
  for (const dep of [...deps, ...downstreams]) {
    map[dep.meta.name] = dep;
  }
  await generateDepLockfiles({
    root,
    deps: Object.keys(map).map(key => map[key]),
    frozenLockfile,
  });
  if (workspace === 'sandbox' && frozenLockfile === false) {
    await generateBazelignore({root, projects: projects});
    await generateBazelBuildRules({root, deps, projects});
  }
  await installDeps({root, deps, hooks});
};

const findDownstreams = async ({root, deps, projects}) => {
  const roots = projects.map(dir => `${root}/${dir}`);
  const metas = await Promise.all(
    roots.map(async dir => ({
      dir,
      meta: JSON.parse(await read(`${dir}/package.json`, 'utf8')),
    }))
  );
  const downstreams = [];
  for (const dep of deps) {
    downstreams.push(...getDownstreams(metas, dep));
  }
  return downstreams;
};

module.exports = {install};
