// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {isProjectInstalled} = require('../utils/is-project-installed.js');
const {install} = require('./install.js');
const {getPassThroughArgs} = require('../utils/parse-argv.js');
const {executeProjectCommand} = require('../utils/execute-project-command.js');

/*::
import type {Stdio} from '../utils/node-helpers.js';
export type StartArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
  stdio?: Stdio,
}
export type Start = (StartArgs) => Promise<void>
*/
const start /*: Start */ = async ({root, cwd, args, stdio = 'inherit'}) => {
  await assertProjectDir({dir: cwd});

  if (!(await isProjectInstalled({root, cwd}))) {
    await install({root, cwd, conservative: true});
  }

  const params = getPassThroughArgs(args);
  await executeProjectCommand({
    root,
    cwd,
    command: 'start',
    args: params,
    stdio,
  });
};

module.exports = {start};
