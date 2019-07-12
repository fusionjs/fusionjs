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
  const tmp = `${root}/third_party/jazelle/temp`;
  await spawn('rm', ['-rf', `${root}/node_modules`]);
  await spawn('rm', ['-rf', `${tmp}`]);
  await spawn(bazel, ['clean', '--expunge'], {
    cwd: root,
    stdio: 'inherit',
  }).catch(() => {}); // user doesn't care for our stack trace, just pipe bazel output instead
};

module.exports = {purge};
