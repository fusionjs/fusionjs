// @flow
const {remove: removeDep} = require('yarn-utilities');
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {read, write, spawn} = require('../utils/node-helpers.js');
const {findLocalDependency} = require('../utils/find-local-dependency.js');
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
    await write(`${cwd}/package.json`, JSON.stringify(meta, null, 2), 'utf8');
  } else {
    await removeDep({roots: [cwd], dep: name});
  }
  await spawn('rm', ['-rf', 'node_modules'], {cwd});
  await spawn('rm', ['-rf', 'node_modules'], {cwd: root});
  await install({root, cwd});
};

module.exports = {remove};
