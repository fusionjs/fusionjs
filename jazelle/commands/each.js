// @flow
const {cpus} = require('os');
const {getManifest} = require('../utils/get-manifest.js');
const {batchTestGroup} = require('../utils/batch-test-group.js');

/*::
import type {Stdio} from '../utils/node-helpers.js';
type EachArgs = {
  root: string,
  args: Array<string>,
  cores?: string,
  stdio?: Stdio,
};
type Each = (EachArgs) => Promise<void>;
*/
const each /*: Each */ = async ({root, args, cores, stdio = 'inherit'}) => {
  const numCores = parseInt(cores, 10) || cpus().length - 1;
  const {projects} = await getManifest({root});
  const plan = [
    projects.map(dir => ({
      type: 'dir',
      dir,
      action: 'exec',
      args,
    })),
  ];
  const failed = await batchTestGroup({
    root,
    data: plan,
    index: 0,
    cores: numCores,
  });
  if (failed.length > 0) {
    console.log(JSON.stringify(failed, null, 2));
    process.exitCode = 1;
    return Promise.reject();
  }
};

module.exports = {each};
