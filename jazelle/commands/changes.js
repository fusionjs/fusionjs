// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');

/*::
type ChangesArgs = {
  root: string,
  files?: string,
  type?: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root, files}) => {
  // Get every changed target
  const targets = await findChangedTargets({root, files});

  console.log(targets.join('\n'));
};

module.exports = {changes};
