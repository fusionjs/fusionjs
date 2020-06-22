// @flow
const {bazel} = require('../utils/binary-paths.js');
const {spawn} = require('../utils/node-helpers.js');
const {getPassThroughArgs} = require('../utils/parse-argv.js');
const {startupFlags} = require('../utils/bazel-commands.js');

/*::
import type {Stdio} from '../utils/node-helpers.js';

export type BazelArgs = {
  root: string,
  args: Array<string>,
  stdio?: Stdio,
}
export type Bazel = (BazelArgs) => Promise<void>
*/
const runBazel /*: Bazel */ = async ({root, args, stdio = 'inherit'}) => {
  const params = getPassThroughArgs(args);
  await spawn(bazel, [...startupFlags, ...params], {
    stdio,
    env: process.env,
    cwd: root,
  });
};

module.exports = {bazel: runBazel};
