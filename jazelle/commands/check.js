const {getManifest} = require('../utils/get-manifest.js');
const {reportMismatchedTopLevelDeps, getErrorMessage} = require('../utils/report-mismatched-top-level-deps.js');

async function check({root}) {
  const manifest = await getManifest(root);
  const result = await reportMismatchedTopLevelDeps(root, manifest.projects, manifest.versionPolicy);
  console.log(result.valid ? 'No problems found' : getErrorMessage(result));
}

module.exports = {check};