// @flow
const meta = require('../package.json');
const {exec, realpath, read} = require('../utils/node-helpers.js');
const {dirname} = require('path');

/*::
type Version = () => Promise<void>;
*/
const version = async () => {
  console.log(`actual: ${meta.version}`);
  const which = (await exec('which jazelle').catch(() => '')).trim();
  if (which) {
    const cli = await realpath(which);
    const data = await read(`${dirname(cli)}/../package.json`, 'utf8');
    const {version} = JSON.parse(data);
    console.log(`system: ${version}`);
  }
};

module.exports = {version};
