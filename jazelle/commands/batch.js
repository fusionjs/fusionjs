// @flow
const {cpus} = require('os');
const {batchTestGroup} = require('../utils/batch-test-group.js');
const {read} = require('../utils/node-helpers.js');

/*::
type BatchArgs = {
  root: string,
  plan?: string,
  index?: string,
  cores?: string,
}
type Batch = (BatchArgs) => Promise<void>
*/
const batch /*: Batch */ = async ({root, plan, index, cores}) => {
  // if no file, fallback to reading from stdin (fd=0)
  const data = JSON.parse(await read(plan || 0).catch(() => '[]'));
  const batchIndex = (parseInt(index, 10) || 0) % data.length;
  const numCores = parseInt(cores, 10) || cpus().length - 1;

  const failed = await batchTestGroup({
    root,
    data,
    index: batchIndex,
    cores: numCores,
  });
  if (failed.length > 0) {
    console.log(JSON.stringify(failed, null, 2));
    process.exitCode = 1;
    return Promise.reject();
  }
};

module.exports = {batch};
