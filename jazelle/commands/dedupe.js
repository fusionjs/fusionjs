// @flow
const {sync} = require('../utils/lockfile.js');
const {getManifest} = require('../utils/get-manifest.js');
const {installDeps} = require('../utils/install-deps.js');
const {read} = require('../utils/node-helpers.js');

/*::
export type DedupeArgs = {
  root: string,
};
export type Dedupe = (DedupeArgs) => Promise<void>;
*/
const dedupe /*: Dedupe */ = async ({root}) => {
  const {projects} = await getManifest({root});
  const tmp = `${root}/third_party/jazelle/temp/yarn-utilities-tmp`;
  await sync({
    roots: projects.map(project => `${root}/${project}`),
    ignore: await Promise.all(
      projects.map(async project => {
        const data = await read(`${root}/${project}/package.json`, 'utf8');
        return JSON.parse(data).name;
      })
    ),
    tmp,
  });
  await installDeps({root});
};

module.exports = {dedupe};
