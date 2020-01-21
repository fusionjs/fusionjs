// @flow
const path = require('path');

const paths = {
  bazel: `${__dirname}/../bin/bazelisk`,
  node: String(process.argv[0]),
  yarn: String(
    process.env.YARN || `${__dirname}/../bin/yarn.js` // this env var is created by rules/jazelle.bzl, the yarn binary is put there by preinstall hook
  ),
};

/*::
export type BinName = string
export type BinPath = (name: BinName) => string
*/
const getBinaryPath /*: BinPath */ = name => {
  return path.resolve(paths[name]);
};

module.exports = {
  ...paths,
  getBinaryPath,
};
