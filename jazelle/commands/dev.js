// @flow
const {assertProjectDir} = require('../utils/assert-project-dir.js');
const {isProjectInstalled} = require('../utils/is-project-installed.js');
const {install} = require('./install.js');
const {getPassThroughArgs} = require('../utils/parse-argv.js');
const {executeProjectCommand} = require('../utils/execute-project-command.js');

/*::
export type DevArgs = {
  root: string,
  cwd: string,
  args: Array<string>,
}
export type Dev = (DevArgs) => Promise<void>
*/
const dev /*: Dev */ = async ({root, cwd, args}) => {
  await assertProjectDir({dir: cwd});

  if (!(await isProjectInstalled({root, cwd}))) {
    await install({root, cwd, conservative: true});
  }

  const params = getPassThroughArgs(args);
  await executeProjectCommand({root, cwd, command: 'dev', args: params});
};

module.exports = {dev};
