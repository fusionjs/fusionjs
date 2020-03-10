// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {isProjectInstalled} = require('../utils/is-project-installed.js');
const {install} = require('./install.js');
const {executeProjectCommand} = require('../utils/execute-project-command.js');

/*::
export type BuildArgs = {
  root: string,
  cwd: string,
}
export type Build = (BuildArgs) => Promise<void>
*/
const build /*: Build */ = async ({root, cwd}) => {
  await assertProjectDir({dir: cwd});

  if (!(await isProjectInstalled({root, cwd}))) {
    await install({root, cwd, conservative: true});
  }

  await executeProjectCommand({root, cwd, command: 'build'});
};

module.exports = {build};
