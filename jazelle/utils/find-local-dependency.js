// @flow
const {getManifest} = require('./get-manifest.js');
const {read} = require('./node-helpers.js');

async function findLocalDependency(root, name) {
  const {projects: dirs} = await getManifest(root);
  const deps = await Promise.all(
    dirs.map(async dir => ({
      dir,
      meta: JSON.parse(await read(`${root}/${dir}/package.json`, 'utf8')),
    }))
  );
  return deps.find(dep => dep.meta.name === name);
}

module.exports = {findLocalDependency};
