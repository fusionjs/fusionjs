// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {read, write, spawn} = require('../utils/node-helpers.js');
const {upgrade: upgradeDep} = require('../utils/lockfile.js');
const {install} = require('./install.js');

/*::
export type UpgradeArgs = {
  root: string,
  cwd: string,
  name: string,
  version?: string,
}
export type Upgrade = (UpgradeArgs) => Promise<void>
*/
const upgrade /*: Upgrade */ = async ({root, cwd, name, version}) => {
  await assertProjectDir({dir: cwd});

  const local = await findLocalDependency({root, name});
  if (local) {
    if (version && version !== local.meta.version) {
      throw new Error(`You must use version ${local.meta.version}`);
    }

    const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    if (meta.dependencies && meta.dependencies[name])
      meta.dependencies[name] = local.meta.version;
    if (meta.devDependencies && meta.devDependencies[name])
      meta.devDependencies[name] = local.meta.version;
    if (meta.peerDependencies && meta.peerDependencies[name])
      meta.peerDependencies[name] = local.meta.version;
    if (meta.optionalDependencies && meta.optionalDependencies[name])
      meta.optionalDependencies[name] = local.meta.version;
    await write(
      `${cwd}/package.json`,
      `${JSON.stringify(meta, null, 2)}\n`,
      'utf8'
    );
  } else {
    const additions = [{name, range: version}];
    const {projects} = await getManifest({root});
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: resolve(root, cwd),
    });
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await upgradeDep({
      roots: [cwd],
      additions,
      ignore: deps.map(d => d.meta.name),
      tmp,
    });
  }
  await spawn('rm', ['-rf', 'node_modules'], {cwd});
  await install({root, cwd});
};

module.exports = {upgrade};
