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
  const numCores = parseInt(cores, 10) || cpus().length;

  await batchTestGroup({root, data, index: batchIndex, cores: numCores});
};

module.exports = {batch};
