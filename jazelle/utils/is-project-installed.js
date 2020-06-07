// @flow
const {read, exists} = require('./node-helpers.js');

/*::
type IsProjectInstalledArgs = {
  root: string,
  cwd: string,
};
type IsProjectInstalled = (IsProjectInstalledArgs) => Promise<boolean>;
type Source = {|
  dir: string,
  hash: string,
  upstreams: Array<string>,
|};
*/
const isProjectInstalled /*: IsProjectInstalled */ = async ({root, cwd}) => {
  const sourceFile = `${root}/node_modules/.jazelle-source`;
  if (await exists(sourceFile)) {
    const source /*: Source */ = JSON.parse(await read(sourceFile, 'utf8'));
    return source.upstreams && source.upstreams.includes(cwd);
  }
  return false;
};

module.exports = {isProjectInstalled};
