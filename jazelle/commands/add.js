// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {node, yarn} = require('../utils/binary-paths.js');
const {exec, read, write} = require('../utils/node-helpers.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {add: addDep} = require('../utils/lockfile.js');
const {install} = require('./install.js');

/*
adding local dep should:
- add it to the project's package.json, pointing to the exact local version
- not add it to the project's yarn.lock
*/

/*::
export type AddArgs = {
  root: string,
  cwd: string,
  name: string,
  version?: string,
  dev?: boolean,
};
export type Add = (AddArgs) => Promise<void>;
*/
const add /*: Add */ = async ({
  root,
  cwd,
  name: nameWithVersion,
  dev = false,
}) => {
  await assertProjectDir({dir: cwd});
  let [, name, version] = nameWithVersion.match(/(@?[^@]*)@?(.*)/) || [];
  const type = dev ? 'devDependencies' : 'dependencies';
  const local = await findLocalDependency({root, name});
  if (local) {
    if (version && version !== local.meta.version) {
      throw new Error(`You must use version ${local.meta.version}`);
    }

    const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    if (!meta[type]) meta[type] = {};
    const types = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];
    for (const t of types) {
      if (meta[t] && meta[t][name]) {
        meta[t][name] = local.meta.version;
      }
    }
    meta[type][name] = local.meta.version;
    await write(`${cwd}/package.json`, JSON.stringify(meta, null, 2), 'utf8');
  } else {
    // adding does not dedupe transitives, since consumers will rarely want to check if they introduced regressions in unrelated projects
    if (!version) {
      version = JSON.parse(
        await exec(`${node} ${yarn} info ${name} version --json 2>/dev/null`)
      ).data;
    }
    const additions = [{name, range: version, type}];
    const {projects} = await getManifest({root});
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: resolve(root, cwd),
    });
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await addDep({
      roots: [cwd],
      additions,
      ignore: deps.map(d => d.meta.name),
      tmp,
    });
  }
  await install({root, cwd});
};

module.exports = {add};
