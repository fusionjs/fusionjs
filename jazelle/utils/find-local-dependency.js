// @flow
const {getManifest} = require('./get-manifest.js');
const {read} = require('./node-helpers.js');

/*::
import type {Metadata} from './get-local-dependencies.js';
export type FindLocalDependencyArgs = {
  root: string,
  name: string,
};
export type FindLocalDependency = (FindLocalDependencyArgs) => Promise<Metadata>
*/
const findLocalDependency /*: FindLocalDependency */ = async ({root, name}) => {
  const {projects: dirs} = /*:: await */ await getManifest({root}); // FIXME: double await is due to Flow bug
  const deps = await Promise.all(
    dirs.map(async dir => ({
      dir,
      meta: JSON.parse(await read(`${root}/${dir}/package.json`, 'utf8')),
    }))
  );
  return deps.find(dep => dep.meta.name === name);
};

module.exports = {findLocalDependency};
