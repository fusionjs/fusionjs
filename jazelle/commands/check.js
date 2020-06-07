// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {check: checkDeps} = require('../utils/lockfile.js');

/*::
export type CheckArgs = {
  root: string,
  json: boolean,
  all: boolean,
};
export type Check = (CheckArgs) => Promise<?string>;
*/
const check /*: Check */ = async args => {
  const {root, json, all} = args;
  const {projects} = await getManifest({root});
  const reported = await checkDeps({
    roots: projects.map(p => `${root}/${p}`),
    all,
  });
  const result = JSON.stringify(reported, null, 2);
  let output;
  if (json) {
    output = result;
    console.log(result);
  } else {
    const ok = Object.keys(reported).length === 0;
    output = ok ? 'No problems found' : `Violations:\n${result}`;
  }
  return output;
};

module.exports = {check};
