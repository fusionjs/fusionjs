// @flow
const {optimize} = require('yarn-utilities');
const {getManifest} = require('../utils/get-manifest.js');
const {installDeps} = require('../utils/install-deps.js');

/*::
export type DedupeArgs = {
  root: string,
};
export type Dedupe = (DedupeArgs) => Promise<void>;
*/
const dedupe /*: Dedupe */ = async ({root}) => {
  const {projects} = await getManifest({root});
  await optimize({roots: projects});
  await installDeps({root});
};

module.exports = {dedupe};
