// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');

/*::
type ChangesArgs = {
  root: string,
  sha1?: string,
  sha2?: string,
  type?: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root, sha1, sha2, type}) => {
  const targets = await findChangedTargets({root, sha1, sha2, type});
  console.log(targets.join('\n'));
};

module.exports = {changes};
