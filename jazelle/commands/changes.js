const {findChangedTargets} = require('../utils/find-changed-targets.js');

async function changes({root}) {
  const targets = await findChangedTargets({root});
  console.log(targets.join('\n'));
}

module.exports = {changes};