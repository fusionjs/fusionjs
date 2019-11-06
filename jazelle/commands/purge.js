// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {spawn} = require('../utils/node-helpers.js');
const {bazel} = require('../utils/binary-paths.js');
const rm = require('fast-rmrf');

/*::
export type PurgeArgs = {
  root: string,
  fork?: boolean,
};
export type Purge = (PurgeArgs) => Promise<void>;
*/
const purge /*: Purge */ = async ({root, fork}) => {
  const {projects = []} = await getManifest({root});
  projects.map(project => {
    rm(`${root}/${project}/node_modules`, {fork});
  });
  rm(`${root}/third_party/jazelle/temp`, {fork});
  rm(`${root}/node_modules`, {fork});
  await spawn(bazel, ['clean', '--expunge'], {
    cwd: root,
    stdio: 'inherit',
  }).catch(() => {}); // user doesn't care for our stack trace, just pipe bazel output instead
};

module.exports = {purge};
