// @flow
const {exists} = require('./node-helpers.js');

/*::
export type AssertProjectDirArgs = {
  dir: string,
}
export type AssertProjectDir = (AssertProjectDirArgs) => Promise<void>
*/
const assertProjectDir /*: AssertProjectDir */ = async ({dir}) => {
  if (!(await exists(`${dir}/package.json`))) {
    throw new Error(
      "Command must be run from a project folder containing a package.json file. `cd` into your project's folder,\nor use the `--cwd` option and ensure it points to a valid path"
    );
  }
};
module.exports = {assertProjectDir};
