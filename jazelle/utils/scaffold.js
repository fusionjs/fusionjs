const {exec} = require('./node-helpers.js');
const {version} = require('../package.json');

async function scaffold({cwd}) {
  await exec(`
    # copy without overwriting
    cp -rn "${__dirname}/../templates/scaffold/" "."
    sed -e "s/VERSION/${version}/g" "${__dirname}/../templates/scaffold/WORKSPACE" > "WORKSPACE"
  `, {cwd});
}

module.exports = {scaffold};