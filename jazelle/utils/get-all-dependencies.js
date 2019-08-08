// @flow
const {read} = require('../utils/node-helpers.js');

/*::
import type {Metadata} from './get-local-dependencies.js';

export type GetAllDependenciesArgs = {
  root: string,
  projects: Array<string>,
};
export type GetAllDependencies = (GetAllDependenciesArgs) => Promise<Array<Metadata>>;
*/

const getAllDependencies /*: GetAllDependencies */ = async ({
  root,
  projects,
}) => {
  const roots = projects.map(dir => `${root}/${dir}`);
  return Promise.all(
    roots.map(async dir => ({
      depth: 0,
      dir,
      meta: JSON.parse(await read(`${dir}/package.json`, 'utf8')),
    }))
  );
};

module.exports = {getAllDependencies};
