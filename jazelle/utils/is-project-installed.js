// @flow
const {read, exists} = require('./node-helpers.js');

/*::
type IsProjectInstalledArgs = {
  root: string,
  cwd: string,
};
type IsProjectInstalled = (IsProjectInstalledArgs) => Promise<boolean>;
*/
const isProjectInstalled /*: IsProjectInstalled */ = async ({root, cwd}) => {
  const sourceFile = `${root}/node_modules/.jazelle-source`;
  if (await exists(sourceFile)) {
    const source = JSON.parse(await read(sourceFile, 'utf8'));
    const dir = source.dir.replace(/\/node_modules$/, '');
    return dir === cwd;
  }
  return false;
};

module.exports = {isProjectInstalled};
