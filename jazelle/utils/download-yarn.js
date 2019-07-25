// @flow
const {exists, exec} = require('./node-helpers');

run();

async function run() {
  const yarnPath = `${__dirname}/../bin/yarn.js`;
  const version = '1.16.0';

  if (!(await exists(yarnPath))) {
    await exec(
      `curl -L -o ${yarnPath} https://github.com/yarnpkg/yarn/releases/download/v${version}/yarn-${version}.js && chmod +x ${yarnPath}`
    );
  }
}
