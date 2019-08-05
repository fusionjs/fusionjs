// @flow
const {minVersion, satisfies} = require('semver');
const {getManifest} = require('../utils/get-manifest.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {upgrade: upgradeDep} = require('../utils/lockfile.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');
const {generateDepLockfiles} = require('../utils/generate-dep-lockfiles.js');
const {read, write} = require('../utils/node-helpers.js');

/*::
export type GreenkeepArgs = {
  root: string,
  name: string,
  version?: string,
  from?: string,
};
export type Greenkeep = (GreenkeepArgs) => Promise<void>;
*/
const greenkeep /*: Greenkeep */ = async ({root, name, version, from}) => {
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
          JSON.stringify(meta, null, 2),
          'utf8'
        );
      })
    );
  } else {
    const upgrades = [{name, range: version, from}];
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await upgradeDep({
      roots,
      upgrades,
      ignore: await Promise.all(
        projects.map(async project => {
          const data = await read(`${root}/${project}/package.json`, 'utf8');
          return JSON.parse(data).name;
        })
      ),
      tmp,
    });
  }
  const ignore = await getAllDependencies({root, projects});
  const deps = await Promise.all(
    roots.map(async dir => ({
      dir,
      meta: JSON.parse(await read(`${dir}/package.json`, 'utf8')),
    }))
  );
  await generateDepLockfiles({root, deps, ignore});
};

const update = (meta, type, name, version, from) => {
  if (meta[type] && meta[type][name]) {
    const min = minVersion(meta[type][name]);
    const inRange = !from || satisfies(min, from);
    if (inRange) meta[type][name] = version;
  }
};

module.exports = {greenkeep};
