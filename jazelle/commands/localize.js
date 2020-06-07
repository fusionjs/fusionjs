// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');
const {write} = require('../utils/node-helpers.js');

/*::
export type LocalizeArgs = {
  root: string,
};
export type Localize = LocalizeArgs => Promise<void>;
*/
const localize /*: Localize */ = async ({root}) => {
  const {projects} = await getManifest({root});
  const deps = /*:: await */ await getAllDependencies({root, projects});
  const map = new Map();
  for (const dep of deps) {
    map.set(dep.meta.name, dep.meta.version);
  }
  await Promise.all(
    deps.map(async dep => {
      for (const key in dep.meta.dependencies) {
        if (map.has(key)) {
          dep.meta.dependencies[key] = map.get(key);
        }
      }
      for (const key in dep.meta.devDependencies) {
        if (map.has(key)) {
          dep.meta.devDependencies[key] = map.get(key);
        }
      }
      const file = `${dep.dir}/package.json`;
      await write(file, JSON.stringify(dep.meta, null, 2) + '\n', 'utf8');
    })
  );
};

module.exports = {localize};
