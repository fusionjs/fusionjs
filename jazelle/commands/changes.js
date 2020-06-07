// @flow
const {findChangedTargets} = require('../utils/find-changed-targets.js');

/*::
type ChangesArgs = {
  root: string,
  files?: string,
  format?: string,
};
type Changes = (ChangesArgs) => Promise<void>;
*/
const changes /*: Changes */ = async ({root, files, format = 'targets'}) => {
  // Get every changed target
  const targets = await findChangedTargets({root, files, format});

  console.log(targets.join('\n'));
};

module.exports = {changes};
