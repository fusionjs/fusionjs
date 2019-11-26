// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {check: checkDeps} = require('../utils/lockfile.js');

/*::
export type CheckArgs = {
  root: string,
  json: boolean,
};
export type Check = (CheckArgs) => Promise<void>;
*/
const check /*: Check */ = async ({root, json}) => {
  const {projects} = await getManifest({root});
  const reported = await checkDeps({roots: projects.map(p => `${root}/${p}`)});
  const result = JSON.stringify(reported, null, 2);
  if (json) {
    console.log(result);
  } else {
    const ok = Object.keys(reported).length === 0;
    console.log(ok ? 'No problems found' : `Violations:\n${result}`);
  }
};

module.exports = {check};
