// @flow
const {optimize} = require('yarn-utilities');
const {getManifest} = require('../utils/get-manifest.js');
const {installDeps} = require('../utils/install-deps.js');

async function dedupe({root}) {
  const {projects} = await getManifest(root);
  await optimize({roots: projects});
  await installDeps(root);
}

module.exports = {dedupe};
