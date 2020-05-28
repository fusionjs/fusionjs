// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {getAllDependencies} = require('../utils/get-all-dependencies.js');

/*::
export type ResolutionsReport = {
  [string]: {
    [string]: string,
  }
};
export type ResolutionsArgs = {
  root: string,
};
export type Resolutions = ResolutionsArgs => Promise<ResolutionsReport>;
*/
const resolutions /*: Resolutions */ = async ({root}) => {
  const {projects} = await getManifest({root});
  const locals = await getAllDependencies({root, projects});

  const output = {};
  for (const local of locals) {
    const {name, resolutions} = local.meta;
    if (resolutions) output[name] = resolutions;
  }
  return output;
};

module.exports = {resolutions};
