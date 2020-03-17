// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {isProjectInstalled} = require('../utils/is-project-installed.js');
const {install} = require('./install.js');
const {executeProjectCommand} = require('../utils/execute-project-command.js');

/*::
import type {Stdio} from '../utils/node-helpers.js';
export type BuildArgs = {
  root: string,
  cwd: string,
  stdio?: Stdio,
}
export type Build = (BuildArgs) => Promise<void>
*/
const build /*: Build */ = async ({root, cwd, stdio = 'inherit'}) => {
  await assertProjectDir({dir: cwd});

  if (!(await isProjectInstalled({root, cwd}))) {
    await install({root, cwd, conservative: true});
  }

  await executeProjectCommand({root, cwd, command: 'build', stdio});
};

module.exports = {build};
