// @flow
const {exec} = require('../utils/node-helpers.js');

/*::
export type InitArgs = {
  cwd: string,
};
export type Init = (InitArgs) => Promise<void>;
*/
const init /*: Init */ = async ({cwd}) => {
  const bin = `${__dirname}/../bin`;
  await exec(`. ${bin}/init.sh`, {cwd, env: {BIN: bin}, shell: '/bin/bash'});
};

module.exports = {init};
