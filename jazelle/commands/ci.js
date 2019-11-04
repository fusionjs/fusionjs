// @flow
const {install} = require('./install.js');

/*::
export type CiArgs = {
  root: string,
  cwd: string,
}
export type Ci = (CiArgs) => Promise<void>
*/
const ci /*: Ci */ = async ({root, cwd}) => {
  await install({root, cwd, frozenLockfile: true});
};

module.exports = {ci};
