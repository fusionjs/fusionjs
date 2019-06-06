// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');

/*::
type ChangesArgs = {
  root: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root}) => {
  const targets = await findChangedTargets({root});
  console.log(targets.join('\n'));
};

module.exports = {changes};
