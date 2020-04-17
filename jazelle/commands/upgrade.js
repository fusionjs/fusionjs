// @flow
const {minVersion, satisfies} = require('../vendor/semver/index.js');
const {getManifest} = require('../utils/get-manifest.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {upgrade: upgradeDep} = require('../utils/lockfile.js');
const {read, write} = require('../utils/node-helpers.js');
const sortPackageJson = require('../utils/sort-package-json');

/*::
export type UpgradeArgs = {
  root: string,
  args: Array<string>,
};
export type Upgrade = (UpgradeArgs) => Promise<void>;
*/
const upgrade /*: Upgrade */ = async ({root, args}) => {
  const {projects} = /*:: await */ await getManifest({root}); // FIXME: double await is due to Flow bug
  const roots = projects.map(dir => `${root}/${dir}`);

  // group by whether the dep is local (listed in manifest.json) or external (from registry)
  const locals = [];
  const externals = [];
  for (const arg of args) {
    let [, name, version] = arg.match(/(@?[^@]*)@?(.*)/) || [];
    const local = await findLocalDependency({root, name});
    if (local) locals.push({local, name, version});
    else externals.push({name, range: version});
  }

  // upgrade local deps
  if (locals.length > 0) {
    await Promise.all(
      roots.map(async cwd => {
        const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));

        for (const {local, name, version} of locals) {
          if (version && version !== local.meta.version) {
            const error = `You must use version ${name}@${local.meta.version}`;
            throw new Error(error);
          }

          update(meta, 'dependencies', name, local.meta.version);
          update(meta, 'devDependencies', name, local.meta.version);
          update(meta, 'peerDependencies', name, local.meta.version);
          update(meta, 'optionalDependencies', name, local.meta.version);
        }
        await write(`${cwd}/package.json`, sortPackageJson(meta), 'utf8');
      })
    );
  }

  // upgrade external deps
  if (externals.length > 0) {
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await upgradeDep({
      roots,
      upgrades: externals,
      ignore: await Promise.all(
        projects.map(async project => {
          const metaFile = `${root}/${project}/package.json`;
          const data = await read(metaFile, 'utf8');
          return JSON.parse(data).name;
        })
      ),
      tmp,
    });
  }
};

const update = (meta, type, name, version, from) => {
  if (meta[type] && meta[type][name]) {
    const min = minVersion(meta[type][name]);
    const inRange = !from || satisfies(min, from);
    if (inRange) meta[type][name] = version;
  }
};

module.exports = {upgrade};
