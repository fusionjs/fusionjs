// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');

/*::
type ChangesArgs = {
  root: string,
  type: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root, type}) => {
  const targets = await findChangedTargets({root, type});
  console.log(targets.join('\n'));
};

module.exports = {changes};
