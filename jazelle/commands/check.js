// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {
  reportMismatchedTopLevelDeps,
  getErrorMessage,
} = require('../utils/report-mismatched-top-level-deps.js');

/*::
export type CheckArgs = {
  root: string,
};
export type Check = (CheckArgs) => Promise<void>;
*/
const check /*: Check */ = async ({root}) => {
  const {projects, versionPolicy} = await getManifest({root});
  const result = await reportMismatchedTopLevelDeps({
    root,
    projects,
    versionPolicy,
  });
  console.log(result.valid ? 'No problems found' : getErrorMessage(result));
};

module.exports = {check};
