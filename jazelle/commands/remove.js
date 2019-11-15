// @flow
const {resolve} = require('path');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {read, write, remove: rm} = require('../utils/node-helpers.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
const {remove: removeDep} = require('../utils/lockfile.js');
const {install} = require('./install.js');

/*::
export type RemoveArgs = {
  root: string,
  cwd: string,
  name: string,
}
export type Remove = (RemoveArgs) => Promise<void>
*/
const remove /*: Remove */ = async ({root, cwd, name}) => {
  await assertProjectDir({dir: cwd});

  const local = await findLocalDependency({root, name});
  if (local) {
    const meta = JSON.parse(await read(`${cwd}/package.json`, 'utf8'));
    if (meta.dependencies && meta.dependencies[name])
      delete meta.dependencies[name];
    if (meta.devDependencies && meta.devDependencies[name])
      delete meta.devDependencies[name];
    if (meta.peerDependencies && meta.peerDependencies[name])
      delete meta.peerDependencies[name];
    if (meta.optionalDependencies && meta.optionalDependencies[name])
      delete meta.optionalDependencies[name];
    await write(
      `${cwd}/package.json`,
      `${JSON.stringify(meta, null, 2)}\n`,
      'utf8'
    );
  } else {
    const {projects} = await getManifest({root});
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: resolve(root, cwd),
    });
    const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
    await removeDep({
      roots: [cwd],
      removals: [name],
      ignore: deps.map(d => d.meta.name),
      tmp,
    });
  }
  await rm(`${cwd}/node_modules`);
  await rm(`${root}/node_modules`);
  await install({root, cwd});
};

module.exports = {remove};
