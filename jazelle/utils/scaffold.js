// @flow
const {exec} = require('./node-helpers.js');
const {version} = require('../package.json');

/*::
export type ScaffoldArgs = {
  cwd: string,
};
export type Scaffold = (ScaffoldArgs) => Promise<void>;
*/
const scaffold /*: Scaffold */ = async ({cwd}) => {
  await exec(
    `# copy without overwriting
    cp -rn "${__dirname}/../templates/scaffold/" "."
    sed -e "s/VERSION/${version}/g" "${__dirname}/../templates/scaffold/WORKSPACE" > "WORKSPACE"`,
    {cwd}
  );
};

module.exports = {scaffold};
