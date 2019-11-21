// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {
  reportMismatchedTopLevelDeps,
  getErrorMessage,
} = require('../utils/report-mismatched-top-level-deps.js');

/*::
export type CheckArgs = {
  root: string,
  json: boolean,
};
export type Check = (CheckArgs) => Promise<void>;
*/
const check /*: Check */ = async ({root, json}) => {
  const {projects, versionPolicy} = await getManifest({root});
  const result = await reportMismatchedTopLevelDeps({
    root,
    projects,
    versionPolicy,
  });
  const message =
    result.valid && !json ? 'No problems found' : getErrorMessage(result, json);
  console.log(message);
};

module.exports = {check};
