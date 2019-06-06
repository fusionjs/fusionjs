// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {spawn} = require('../utils/node-helpers.js');
const {bazel} = require('../utils/binary-paths.js');

/*::
export type PurgeArgs = {
  root: string,
};
export type Purge = (PurgeArgs) => Promise<void>;
*/
const purge /*: Purge */ = async ({root}) => {
  const {projects = []} = await getManifest({root});
  await Promise.all(
    projects.map(project => {
      return spawn('rm', ['-rf', `${root}/${project}/node_modules`]);
    })
  );
  await spawn('rm', ['-rf', `${root}/third_party/jazelle/temp/node_modules`]);
  await spawn('rm', [`${root}/third_party/jazelle/temp/cache-key.txt`]);
  await spawn(bazel, ['clean', '--expunge']);
};

module.exports = {purge};
