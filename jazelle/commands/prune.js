// @flow
const {prune: pruneDeps} = require('../utils/lockfile.js');
const {getManifest} = require('../utils/get-manifest.js');
const {read} = require('../utils/node-helpers.js');

/*::
export type PruneArgs = {
  root: string,
};
export type Prune = (PruneArgs) => Promise<void>;
*/
const prune /*: Prune */ = async ({root}) => {
  const {projects, registry} = await getManifest({root});
  await pruneDeps({
    registry,
    roots: projects.map(project => `${root}/${project}`),
    ignore: await Promise.all(
      projects.map(async project => {
        const data = await read(`${root}/${project}/package.json`, 'utf8');
        return JSON.parse(data).name;
      })
    ),
  });
};

module.exports = {prune};
