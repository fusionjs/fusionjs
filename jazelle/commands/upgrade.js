// @flow
const {minVersion, satisfies} = require('semver');
const {getManifest} = require('../utils/get-manifest.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {upgrade: upgradeDep} = require('../utils/lockfile.js');
const {read, write} = require('../utils/node-helpers.js');

/*::
export type UpgradeArgs = {
  root: string,
  name: string,
  from?: string,
};
export type Upgrade = (UpgradeArgs) => Promise<void>;
*/
const upgrade /*: Upgrade */ = async ({root, name: nameWithVersion, from}) => {
  let [, name, version] = nameWithVersion.match(/(@?[^@]*)@?(.*)/) || [];
  const {projects} = /*:: await */ await getManifest({root}); // FIXME: double await is due to Flow bug
  const roots = projects.map(dir => `${root}/${dir}`);
  const local = await findLocalDependency({root, name});
  if (local) {
    if (version && version !== local.meta.version) {
      throw new Error(`You must use version ${local.meta.version}`);
    }

    await Promise.all(
      roots.map(async cwd => {
        const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
        update(meta, 'dependencies', name, local.meta.version, from);
        update(meta, 'devDependencies', name, local.meta.version, from);
        update(meta, 'peerDependencies', name, local.meta.version, from);
        update(meta, 'optionalDependencies', name, local.meta.version, from);
        await write(
          `${cwd}/package.json`,
          `${JSON.stringify(meta, null, 2)}\n`,
          'utf8'
        );
      })
    );
  } else {
    const upgrades = [{name, range: version, from}];
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    const cache = {};
    await Promise.all(
      roots.map(async dir => {
        await upgradeDep({
          roots: [dir],
          upgrades,
          ignore: await Promise.all(
            projects.map(async project => {
              const metaFile = `${root}/${project}/package.json`;
              const data = await read(metaFile, 'utf8');
              return JSON.parse(data).name;
            })
          ),
          tmp,
          cache,
        });
      })
    );
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
