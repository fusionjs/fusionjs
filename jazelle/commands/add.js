// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');
const {shouldSync, getVersion} = require('../utils/version-onboarding.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {read, write} = require('../utils/node-helpers.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {add: addDep} = require('../utils/lockfile.js');
const {install} = require('./install.js');

/*
adding local dep should:
- add it to the project's package.json, pointing to the exact local version
- update the BUILD.bazel file `deps` field
- not add it to the project's yarn.lock
*/

/*::
export type AddArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  version?: string,
  dev?: boolean,
};
export type Add = (AddArgs) => Promise<void>;
*/
const add /*: Add */ = async ({root, cwd, args, dev = false}) => {
  await assertProjectDir({dir: cwd});

  const type = dev ? 'devDependencies' : 'dependencies';

  // group by whether the dep is local (listed in manifest.json) or external (from registry)
  const locals = [];
  const externals = [];
  for (const arg of args) {
    let [, name, version] = arg.match(/(@?[^@]*)@?(.*)/) || [];
    const local = await findLocalDependency({root, name});
    if (local) locals.push({local, name});
    else externals.push({name, range: version, type});
  }

  // add local deps
  if (locals.length > 0) {
    const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    if (!meta[type]) meta[type] = {};

    for (const {local, name} of locals) {
      // update existing entries
      const types = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
        'resolutions',
      ];
      for (const t of types) {
        if (meta[t] && meta[t][name]) {
          meta[t][name] = local.meta.version;
        }
      }
      meta[type][name] = local.meta.version;
    }
    await write(
      `${cwd}/package.json`,
      `${JSON.stringify(meta, null, 2)}\n`,
      'utf8'
    );
  }

  // add external deps
  if (externals.length > 0) {
    const {projects, versionPolicy} = await getManifest({root});
    const unversioned = externals.filter(({range}) => !range);
    if (unversioned.length > 0 && versionPolicy) {
      const deps = await getAllDependencies({root, projects});
      for (const external of unversioned) {
        const {name} = external;
        if (shouldSync({versionPolicy, name})) {
          const version = getVersion({name, deps});
          if (version !== '') external.range = version;
        }
      }
    }
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: resolve(root, cwd),
    });
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await addDep({
      roots: [cwd],
      additions: externals,
      ignore: deps.map(d => d.meta.name),
      tmp,
    });
  }

  await install({root, cwd, conservative: false});
};

module.exports = {add};
